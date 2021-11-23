import { AccumulatedReward, Reward, AccountHistory, RewardItem } from '../generated/model';
import { DatabaseManager, EventContext, StoreContext, SubstrateBlock, SubstrateEvent, SubstrateExtrinsic } from "@subsquid/hydra-common";
import {
    eventId,
    eventIdFromBlockAndIdx,
    timestampToDate
} from "./helpers/common";
import { Balance } from "@polkadot/types/interfaces";
import { handleRewardRestakeForAnalytics, handleSlashForAnalytics } from "./StakeChanged"
import { cachedRewardDestination, cachedController } from "./helpers/Cache"
import { Staking } from '../types';
import { allBlockEvents,  apiService } from './helpers/api';

export async function handleRewarded({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {
    await handleReward({
        store,
        event,
        block,
        extrinsic,
    })
}

export async function handleReward({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {
    // keep track of stake changes that is happening
    // for addresses across block
    await handleRewardRestakeForAnalytics({
        store,
        event,
        block,
        extrinsic,
    })

    await handleAccountRewardTxHistory({
        store,
        event,
        block,
        extrinsic,
    })

    // Increments reward balance for an account
    await updateAccumulatedReward(
        store,
        event,
        true);
}



async function handleAccountRewardTxHistory({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {

  const [account, amount] = new Staking.RewardedEvent(event).params
  const accountAddress = account.toString()

  let  element = new AccountHistory({
         id:  eventId(event)
     });
 let validator = "", stash ="", era = -1

 if(extrinsic?.method == 'payoutStakers'){
    let params = new Staking.Payout_stakersCall(extrinsic)
    era = params.era.toNumber()
    validator = params.validator_stash.toString()
 } else if(extrinsic?.method == 'payoutValidator'){
    let params = new Staking.Payout_validatorCall(extrinsic)
    era = params.era.toNumber()
     validator = extrinsic.signer.toString()
 } else if(extrinsic?.method == 'payoutNominator'){
    // @todo to check case for payoutNominator
    let params = new Staking.Payout_nominatorCall(extrinsic)
    era = params.era.toNumber()
     validator = ""
 }

 // Reward destination may not be the same as the account from the event param
 // need to call the storage function payee and check the below conditions 
 // to correctly identify the destination

 let rewardDestination = await cachedRewardDestination(accountAddress, event as SubstrateEvent, block)

 if (rewardDestination.isStaked || rewardDestination.isStash) {
     stash = accountAddress
 } else if (rewardDestination.isController) {
     stash = await cachedController(accountAddress, event as SubstrateEvent, block)
 } else if (rewardDestination.isAccount) {
     stash = rewardDestination.asAccount.toString()
 }

  element.address = account.toString()
  element.blockNumber = block.height
  element.extrinsicHash = extrinsic?.hash
  element.timestamp = timestampToDate(block)
  element.item = new RewardItem({
      reward: new Reward({
          amount: amount.toBigInt(),
          era: era,
          eventIdx: event.id.toString(),
          validator: validator,
          stash: stash
      })
  })

  await store.save(element)
}


export async function handleSlashed({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {
    await handleSlash({
        store,
        event,
        block,
        extrinsic,
    })
}

export async function handleSlash({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {
    await handleSlashForAnalytics({
        store,
        event,
        block,
        extrinsic,
    })
    await handleSlashForTxHistory({
        store,
        event,
        block,
        extrinsic,
    })
   // Decrements reward balance for an account
    await updateAccumulatedReward(store, event, false)
}

async function handleSlashForTxHistory({
    store,
    event,
    block,
    extrinsic,
}: EventContext & StoreContext): Promise<void> {
    let  element: Array<AccountHistory> | AccountHistory = await store.find(AccountHistory, // recheck
        {
            where: { id: eventId(event) }
        });
    if (element.length !== 0) {
        // already processed reward previously
        return;
    }
     element = new AccountHistory({
         id:  eventId(event)
     });

    const api = await apiService()

    const currentEra = (await api.query.staking.currentEra()).unwrap()
    // recheck
    const slashDeferDuration = await api.consts.staking.slashDeferDuration
    const slashEra = slashDeferDuration == undefined
        ? currentEra.toNumber()
        : currentEra.toNumber() - slashDeferDuration.toNumber()
     //recheck
    const eraStakersInSlashEra = await api.query.staking.erasStakersClipped.entries(slashEra)
    const validatorsInSlashEra = eraStakersInSlashEra.map(([key, exposure]) => {
        let [, validatorId] = key.args

        return validatorId.toString()
    })
    const validatorsSet = new Set(validatorsInSlashEra)

    const initialValidator: string = ""

    await buildRewardEvents(
        element,
        block,
        extrinsic,
        store,
        event.method,
        event.section || event.name.split(".")[0],
        {},
        initialValidator,
        (currentValidator, eventAccount) => {
            return validatorsSet.has(eventAccount) ? eventAccount : currentValidator
        },
        (validator, eventIdx, stash, amount): any => {

            return {
                eventIdx: eventIdx,
                amount: amount,
                stash: stash,
                validator: validator,
                era: slashEra
            }
        }
    )
}

async function buildRewardEvents<A>(
    element: AccountHistory,
    block: SubstrateBlock,
    extrinsic: SubstrateExtrinsic | undefined,
    store: DatabaseManager,
    eventMethod: String,
    eventSection: String,
    accountsMapping: { [address: string]: string },
    initialInnerAccumulator: A,
    produceNewAccumulator: (currentAccumulator: A, eventAccount: string) => A,
    produceReward: (currentAccumulator: A, eventIdx: number, stash: string, amount: string) => Reward
) {
    let blockNumber = block.height
    let events = await allBlockEvents(blockNumber)
    const [, savingPromises] = events.reduce<[A, Promise<void>[]]>(
        (accumulator, eventRecord, eventIndex) => {
            let [innerAccumulator, currentPromises] = accumulator

            if (!(eventRecord.method == eventMethod && eventRecord.section == eventSection)) return accumulator

            const [account, amount] = new Staking.SlashedEvent(eventRecord).params

            const newAccumulator = produceNewAccumulator(innerAccumulator, account.toString())

            const eventId = eventIdFromBlockAndIdx(blockNumber.toString(), eventIndex.toString())

            const element = new AccountHistory({
                id: eventId
            });

            element.timestamp = timestampToDate(block)

            const accountAddress = account.toString()
            const destinationAddress = accountsMapping[accountAddress]
            element.address = destinationAddress != undefined ? destinationAddress : accountAddress

            element.blockNumber = block.height
            if (extrinsic !== null && extrinsic !== undefined) {
                element.extrinsicHash = extrinsic.hash && extrinsic.hash.toString()
                element.extrinsicIdx = extrinsic.id
            }
            element.item = new RewardItem({
                reward: produceReward(newAccumulator, eventIndex, accountAddress, amount.toString())
            })

            currentPromises.push(store.save(element))

            return [newAccumulator, currentPromises];
        }, [initialInnerAccumulator, []])

    await Promise.allSettled(savingPromises);
}

async function updateAccumulatedReward(store: DatabaseManager, event: SubstrateEvent, isReward: boolean): Promise<void> {
    // For both reward and slash, the params are parsed the same way
    const [accountId, amount] =  new Staking.RewardedEvent(event).params 

    let accountAddress = accountId.toString()

    let accumulatedReward = await store.get(AccumulatedReward, {
        where: { id: accountAddress },
    })

    if (accumulatedReward == null) {
        accumulatedReward = new AccumulatedReward({
            id: accountAddress
        });
        accumulatedReward.amount = BigInt(0)
    }
    const newAmount = (amount as Balance).toBigInt()
    accumulatedReward.amount = accumulatedReward.amount + (isReward ? newAmount : -newAmount)
    await store.save(accumulatedReward)
}
