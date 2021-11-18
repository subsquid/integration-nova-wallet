// import {AccumulatedReward, ErrorEvent, Extrinsic, HistoryElement, Reward} from '../generated/model';
// import {DatabaseManager, EventContext, ExtrinsicArg, StoreContext, SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "@subsquid/hydra-common";
// import {
//     callsFromBatch,
//     isBatch,
//     timestamp,
//     eventId,
//     isProxy,
//     callFromProxy,
//     eventIdFromBlockAndIdx
// } from "./helpers/common";
// import {CallBase} from "@polkadot/types/types/calls";
// import {AnyTuple} from "@polkadot/types/types/codec";
// import {EraIndex, RewardDestination} from "@polkadot/types/interfaces/staking"
// import {Balance} from "@polkadot/types/interfaces";
// import {handleRewardRestakeForAnalytics, handleSlashForAnalytics} from "./StakeChanged"
// import {cachedRewardDestination, cachedController} from "./helpers/Cache"
// import { Staking } from '../types';
// import { allBlockEvents, allBlockExrinisics, allBlockExtrinsics, apiService } from './helpers/api';

// function isPayoutStakers(call: allBlockExrinisics): boolean {
//     return call.method == "payoutStakers"
// }

// function isPayoutValidator(call: allBlockExrinisics): boolean {
//     return call.method == "payoutValidator"
// }

// function extractArgsFromPayoutStakers(call: allBlockExrinisics): [string, number] {
//     const {validator_stash,era } = new Staking.Payout_stakersCall(call  as SubstrateExtrinsic)
//     return [validator_stash.toString(), era.toNumber()]
// }

// function extractArgsFromPayoutValidator(call: allBlockExrinisics, sender: string): [string, number] {
//     const {era} = new Staking.Payout_validatorCall(call as SubstrateExtrinsic)

//     return [sender, era.toNumber()]
// }

// export async function handleRewarded({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void> {
//     await handleReward({
//         store,
//         event,
//         block,
//         extrinsic,
//       })
// }

// export async function handleReward({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void>{
//     await handleRewardRestakeForAnalytics({
//     store,
//     event,
//     block,
//     extrinsic,
//   })
//     await handleRewardForTxHistory({
//     store,
//     event,
//     block,
//     extrinsic,
//   })
//     await updateAccumulatedReward(
//     store,
//     event,
//     true)
// }

// async function handleRewardForTxHistory({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void> {
//     const element = await store.find(HistoryElement, // recheck
//         {
//           where: {id:eventId(event) }
//         });
//     // recheck
//     if (element.length !== 0) {
//         // already processed reward previously
//         return;
//     }

//     const blockExtrinsic = await allBlockExtrinsics(block.height);
//     let payoutCallsArgs = blockExtrinsic
//         .map((extrinsic:allBlockExrinisics) => determinePayoutCallsArgs(extrinsic, extrinsic.signer.toString()))
//         .filter((args:any) => args.length != 0)
//         .flat()

//     if (payoutCallsArgs.length == 0) {
//         return
//     }

//     const payoutValidators = payoutCallsArgs.map(([validator,]:any) => validator)

//     const initialCallIndex = -1

//     var accountsMapping: {[address: string]: string} = {}
//     let events = await allBlockEvents(block.height)
//     for (const eventRecord of events) {
//         if (
//             eventRecord.section == (event.section || event.name.split(".")[0]) && 
//             eventRecord.method == event.method) {

//             const [account, _] = new Staking.RewardedEvent(eventRecord).params

//             let accountAddress = account.toString()
//             let rewardDestination = await cachedRewardDestination(accountAddress, eventRecord as SubstrateEvent, block)

//             if (rewardDestination.isStaked || rewardDestination.isStash) {
//                 accountsMapping[accountAddress] = accountAddress
//             } else if (rewardDestination.isController) {
//                 accountsMapping[accountAddress] = await cachedController(accountAddress, eventRecord as SubstrateEvent, block)
//             } else if (rewardDestination.isAccount) {
//                 accountsMapping[accountAddress] = rewardDestination.asAccount.toString()
//             }
//         }
//     }

//     await buildRewardEvents(
//         block,
//         extrinsic,
//         store,
//         event.method,
//         event.section || event.name.split(".")[0],
//         accountsMapping,
//         initialCallIndex,
//         (currentCallIndex, eventAccount) => {
//             if (payoutValidators.length > currentCallIndex + 1) {
//                 return payoutValidators[currentCallIndex + 1] == eventAccount ? currentCallIndex + 1 : currentCallIndex
//             } else {
//                 return currentCallIndex
//             }
//         },
//         (currentCallIndex, eventIdx, stash, amount):any => {
//             if (currentCallIndex == -1) {
//                 return {
//                     eventIdx: eventIdx,
//                     amount: amount,
//                     isReward: true,
//                     stash: stash,
//                     validator: "",
//                     era: -1
//                 }
//             } else {
//                 const [validator, era] = payoutCallsArgs[currentCallIndex]
//                 return {
//                     eventIdx: eventIdx,
//                     amount: amount,
//                     isReward: true,
//                     stash: stash,
//                     validator: validator,
//                     era: era
//                 }
//             }
//         }
//     )
// }

// function determinePayoutCallsArgs(extrinsic:allBlockExrinisics, sender: string) : [string, number][] {
//     if (isPayoutStakers(extrinsic)) {
//         return [extractArgsFromPayoutStakers(extrinsic)]
//     } else if (isPayoutValidator(extrinsic)) {
//         return [extractArgsFromPayoutValidator(extrinsic, sender)]
//     } else if (isBatch(extrinsic)) {
//         return callsFromBatch(extrinsic)
//             .map((call:any) => {
//                 return determinePayoutCallsArgs(call, sender)
//                     .map((value, index, array) => {
//                         return value
//                     })
//             })
//             .flat()
//     } else if (isProxy(extrinsic)) {
//         let proxyCall = callFromProxy(extrinsic)
//         return determinePayoutCallsArgs(proxyCall, sender)
//     } else {
//         return []
//     }
// }

// export async function handleSlashed({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void> {
//     await handleSlash({
//         store,
//         event,
//         block,
//         extrinsic,
//       })
// }

// export async function handleSlash({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void> {
//     await handleSlashForAnalytics({
//         store,
//         event,
//         block,
//         extrinsic,
//       })
//     await handleSlashForTxHistory({
//         store,
//         event,
//         block,
//         extrinsic,
//       })
//     await updateAccumulatedReward(store, event, false)
// }

// async function handleSlashForTxHistory({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void > {
//     const element = await store.find(HistoryElement, // recheck
//         {
//           where: {id:eventId(event) }
//         });
//     // recheck
//     if (element.length !== 0) {
//         // already processed reward previously
//         return;
//     }
//     const api = await apiService()

//     const currentEra = (await api.query.staking.currentEra()).unwrap()
//     const slashDeferDuration = await api.consts.staking.slashDeferDuration

//     const slashEra = slashDeferDuration == undefined 
//     ? currentEra.toNumber()
//     : currentEra.toNumber() - slashDeferDuration.toNumber()

//     const eraStakersInSlashEra = await api.query.staking.erasStakersClipped.entries(slashEra);
//     const validatorsInSlashEra = eraStakersInSlashEra.map(([key, exposure]) => {
//         let [, validatorId] = key.args

//         return validatorId.toString()
//     })
//     const validatorsSet = new Set(validatorsInSlashEra)

//     const initialValidator: string = ""

//     await buildRewardEvents(
//         block,
//         extrinsic,
//         store,
//         event.method,
//         event.section || event.name.split(".")[0],
//         {},
//         initialValidator,
//         (currentValidator, eventAccount) => {
//             return validatorsSet.has(eventAccount) ? eventAccount : currentValidator
//         },
//         (validator, eventIdx, stash, amount):any => {

//             return {
//                 eventIdx: eventIdx,
//                 amount: amount,
//                 isReward: false,
//                 stash: stash,
//                 validator: validator,
//                 era: slashEra
//             }
//         }
//     )
// }

// async function buildRewardEvents<A>(
//     block: SubstrateBlock,
//     extrinsic: SubstrateExtrinsic | undefined,
//     store: DatabaseManager,
//     eventMethod: String,
//     eventSection: String,
//     accountsMapping: {[address: string]: string},
//     initialInnerAccumulator: A,
//     produceNewAccumulator: (currentAccumulator: A, eventAccount: string) => A,
//     produceReward: (currentAccumulator: A, eventIdx: number, stash: string, amount: string) => Reward
// ) {
//     let blockNumber = block.height
//     let blockTimestamp = timestamp(block)
//     let events = await allBlockEvents(blockNumber)
//     const [, savingPromises] = events.reduce<[A, Promise<void>[]]>(
//         (accumulator, eventRecord, eventIndex) => {
//             let [innerAccumulator, currentPromises] = accumulator

//             if (!(eventRecord.method == eventMethod && eventRecord.section == eventSection)) return accumulator

//             const [account, amount] = new Staking.SlashedEvent(eventRecord).params

//             const newAccumulator = produceNewAccumulator(innerAccumulator, account.toString())

//             const eventId = eventIdFromBlockAndIdx(blockNumber.toString(), eventIndex.toString())

//             const element = new HistoryElement({
//             id: eventId
//             });

//             element.timestamp = blockTimestamp

//             const accountAddress = account.toString()
//             const destinationAddress = accountsMapping[accountAddress]
//             element.address = destinationAddress != undefined ? destinationAddress : accountAddress

//             element.blockNumber = block.height
//             if (extrinsic !== null && extrinsic !== undefined) {
//                 element.extrinsicHash = extrinsic.hash && extrinsic.hash.toString()
//                 element.extrinsicIdx = extrinsic.id
//             }
//             element.reward = produceReward(newAccumulator, eventIndex, accountAddress, amount.toString())

//             currentPromises.push(store.save(element))

//             return [newAccumulator, currentPromises];
//         }, [initialInnerAccumulator, []])

//     await Promise.allSettled(savingPromises);
// }

// async function updateAccumulatedReward(store : DatabaseManager, event: SubstrateEvent, isReward: boolean): Promise<void> {
//     const [accountId, amount] = isReward ? new Staking.RewardedEvent(event).params 
//     : new Staking.SlashedEvent(event).params;

//     let accountAddress = accountId.toString()

//     let accumulatedReward = await store.get(AccumulatedReward, {
//         where: { id: accountAddress  },
//       })

//     if (accumulatedReward == null) {
//         accumulatedReward = new AccumulatedReward({
//         id: accountAddress
//         });
//         accumulatedReward.amount = BigInt(0)
//     }
//     const newAmount = (amount as Balance).toBigInt()
//     accumulatedReward.amount = accumulatedReward.amount + (isReward ? newAmount : -newAmount)
//     await store.save(accumulatedReward)
// }
