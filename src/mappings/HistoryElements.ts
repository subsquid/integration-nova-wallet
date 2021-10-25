// import {DatabaseManager,ExtrinsicContext, StoreContext, SubstrateExtrinsic, SubstrateBlock} from '@subsquid/hydra-common'
// import {HistoryElement, Transfer} from "../generated/model";
// import {
//     callFromProxy, callsFromBatch,
//     calculateFeeAsString,
//     extrinsicIdFromBlockAndIdx, isBatch, isProxy,
//     isTransfer,
//     timestamp
// } from "./helpers/common";
// import {CallBase} from "@polkadot/types/types/calls";
// import {AnyTuple} from "@polkadot/types/types/codec";
// import {u64} from "@polkadot/types";
// import { getOrCreate } from './helpers/helpers';

// export async function handleHistoryElement({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: ExtrinsicContext & StoreContext): Promise<void> {
//     const isSigned  = extrinsic.signature;
//     if (isSigned) {
//         let failedTransfers = findFailedTransferCalls(extrinsic, block)
//         if (failedTransfers != null) {
//             await saveFailedTransfers(failedTransfers, extrinsic, block, store)
//         } else {
//             await saveExtrinsic(extrinsic, block, store)
//         }
//     }
// }

// async function saveFailedTransfers(
//     transfers: Transfer[],
//     extrinsic: SubstrateExtrinsic,
//     block: SubstrateBlock,
//     store: DatabaseManager): Promise<void> {
//     let promises = transfers.map(async transfer => {
//         let extrinsicHash = extrinsic.hash;
//         let blockNumber = block.height
//         let extrinsicIdx = extrinsic.id
//         let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)
//         let blockTimestamp = timestamp(block);

//         const elementFrom =  await getOrCreate(store, HistoryElement,extrinsicId+`-from`)
//         elementFrom.address = transfer.from
//         elementFrom.blockNumber = blockNumber
//         elementFrom.extrinsicHash = extrinsicHash
//         elementFrom.extrinsicIdx = extrinsicIdx
//         elementFrom.timestamp = blockTimestamp
//         elementFrom.transfer = transfer

//         const elementTo = await getOrCreate(store, HistoryElement,extrinsicId+`-to`)
//         elementTo.address = transfer.to
//         elementTo.blockNumber = blockNumber
//         elementTo.extrinsicHash = extrinsicHash
//         elementTo.extrinsicIdx = extrinsicIdx
//         elementTo.timestamp = blockTimestamp
//         elementTo.transfer = transfer

//         return [ store.save(elementFrom),store.save(elementTo)]
//     })
//     await Promise.allSettled(promises)
// }

// async function saveExtrinsic(extrinsic: SubstrateExtrinsic, block : SubstrateBlock, store: DatabaseManager): Promise<void> {
//     let blockNumber = block.height;
//     let extrinsicIdx = extrinsic.id
//     let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)

//     const element = await getOrCreate(store, HistoryElement,extrinsicId)
//     element.address = extrinsic.signer.toString()
//     element.blockNumber = blockNumber
//     element.extrinsicHash = extrinsic.hash
//     element.extrinsicIdx = extrinsicIdx
//     element.timestamp = timestamp(block)
//     element.extrinsic = {
//         hash: extrinsic.hash || '',
//         module: extrinsic.section,
//         call: extrinsic.method,
//         success: true, // recheck this
//         fee: calculateFeeAsString(extrinsic)
//     }
//     await store.save(element)
// }

// /// Success Transfer emits Transfer event that is handled at Transfers.ts handleTransfer()
// function findFailedTransferCalls(
//     extrinsic: SubstrateExtrinsic,
//     block: SubstrateBlock): Transfer[] | null {
//     if (extrinsic.hash) { // recheck .success
//         return null;
//     }

//     // let transferCallsArgs = determineTransferCallsArgs(extrinsic.method)
//     // if (transferCallsArgs.length == 0) {
//     //     return null;
//     // }

//     let sender = extrinsic.signer
//     return null;
//     // return transferCallsArgs.map(tuple => {
//     //     let blockNumber = block.height;
//     //     return {
//     //         extrinsicHash: extrinsic.hash || '',
//     //         amount: tuple[1].toString(),
//     //         from: sender.toString(),
//     //         to: tuple[0],
//     //         blockNumber: blockNumber,
//     //         fee: calculateFeeAsString(extrinsic),
//     //         eventIdx: -1,
//     //         success: false
//     //     }
//     // })
// }

// function determineTransferCallsArgs(causeCall: CallBase<AnyTuple>) : [string, bigint][] {
//     if (isTransfer(causeCall)) {
//         return [extractArgsFromTransfer(causeCall)]
//     } else if (isBatch(causeCall)) {
//         return callsFromBatch(causeCall)
//             .map(call => {
//                 return determineTransferCallsArgs(call)
//                     .map((value, index, array) => {
//                         return value
//                     })
//             })
//             .flat()
//     } else if (isProxy(causeCall)) {
//         let proxyCall = callFromProxy(causeCall)
//         return determineTransferCallsArgs(proxyCall)
//     } else {
//         return []
//     }
// }

// function extractArgsFromTransfer(call: CallBase<AnyTuple>): [string, bigint] {
//     const [destinationAddress, amount] = call.args

//     return [destinationAddress.toString(), (amount as u64).toBigInt()]
// }
