import {EventContext, StoreContext, DatabaseManager} from '@subsquid/hydra-common'
import {AccumulatedStake, StakeChange} from '../generated/model';
import { getOrCreate } from './helpers/helpers';
import { convertAddressToSubstrate, eventId, timestamp} from "./helpers/common";
import {Balance} from "@polkadot/types/interfaces";
import { Staking } from '../types'
import { cachedRewardDestination } from './helpers/Cache';

export async function handleBonded({
    store,
    event,
    block,
    extrinsic,
  }: EventContext & StoreContext): Promise<void>{
    const [stash, amount] = new Staking.BondedEvent(event).params

    let address = stash.toString()
    let amountBalance = amount.toBigInt()
    let accumulatedAmount = await handleAccumulatedStake(address, amountBalance, store)

    const element = await getOrCreate(
        store,
        StakeChange,
        eventId(event)
      );
    if (event.extrinsic !== undefined && event.extrinsic !== null) {
        element.extrinsicHash = event.extrinsic?.hash
    }
    element.blockNumber = block.height
    element.eventIdx = event.id
    element.timestamp = timestamp(block)
    element.address = address
    element.amount = amountBalance
    element.accumulatedAmount = accumulatedAmount
    element.type = "bonded"

    await store.save(element)
}

export async function handleUnbonded({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void>{
  const [stash, amount] = new Staking.UnbondedEvent(event).params

    let address = stash.toString()
    let amountBalance = (amount as Balance).toBigInt() * -1n // need to subtract
    let accumulatedAmount = await handleAccumulatedStake(address, amountBalance, store)

    const element =await getOrCreate(
      store,
      StakeChange,
      eventId(event)
    );
    if (event.extrinsic !== undefined && event.extrinsic !== null) {
        element.extrinsicHash = event.extrinsic?.hash;
    }
    element.blockNumber = block.height
    element.eventIdx = event.id
    element.timestamp = timestamp(block)
    element.address = address
    element.amount = amountBalance
    element.accumulatedAmount = accumulatedAmount
    element.type = "unbonded"

    await store.save(element)
}

export async function handleSlashForAnalytics({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [validatorOrNominatorAccountId, amount] = new Staking.SlashedEvent(event).params

    let address = validatorOrNominatorAccountId.toString()
    let amountBalance = amount.toBigInt() * -1n
    let accumulatedAmount = await handleAccumulatedStake(address, amountBalance, store)

    const element =await getOrCreate(
      store,
      StakeChange,
      eventId(event)
    );
    if (event.extrinsic !== undefined && event.extrinsic !== null) {
        element.extrinsicHash = event.extrinsic?.hash
    }
    element.blockNumber = block.height
    element.eventIdx = event.id
    element.timestamp = timestamp(block)
    element.address = validatorOrNominatorAccountId.toString()
    element.amount = amountBalance
    element.accumulatedAmount = accumulatedAmount
    element.type = "slashed"

    await store.save(element)
}

export async function handleRewardRestakeForAnalytics({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void>{
    const [accountId, amount] = new Staking.RewardedEvent(event).params
    let accountAddress= accountId.toString()

    const payee = await cachedRewardDestination(accountAddress, event, block)
    if (payee?.isStaked) {
        let amountBalance = amount.toBigInt()
        let accumulatedAmount = await handleAccumulatedStake(accountAddress, amountBalance, store)

        const element =await getOrCreate(
          store,
          StakeChange,
          eventId(event)
        );
        if (event.extrinsic !== undefined && event.extrinsic !== null) {
            element.extrinsicHash = event.extrinsic?.hash
        }
        element.blockNumber = block.height
        element.eventIdx = event.id
        element.timestamp = timestamp(block)
        element.address = accountAddress
        element.amount = amountBalance
        element.accumulatedAmount = accumulatedAmount
        element.type = "rewarded"

        await store.save(element)
    }
}

async function handleAccumulatedStake(address: string, amount: bigint, store: DatabaseManager): Promise<bigint> {
    let accumulatedStake =  await store.find(AccumulatedStake, // recheck
        {
          where: {id: address}
        });
    if (accumulatedStake.length !==0) {
        let accumulatedAmount = BigInt(accumulatedStake[0].amount)
        accumulatedAmount += (amount) 
        accumulatedStake[0].amount = accumulatedAmount
        await store.save(accumulatedStake)
        return accumulatedAmount
    } else {
        let accumulatedStake = await getOrCreate(
            store,
            AccumulatedStake,
            address
          );
        accumulatedStake.amount = amount
        store.save(accumulatedStake)
        return amount
    }
}

