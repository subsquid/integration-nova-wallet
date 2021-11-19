import { DatabaseManager, ExtrinsicContext, StoreContext, SubstrateExtrinsic, SubstrateBlock } from '@subsquid/hydra-common'
import { Extrinsic, AccountHistory, Transfer, ExtrinsicItem } from "../generated/model";
import {
  calculateFeeAsString,
  extrinsicIdFromBlockAndIdx,
  timestamp,
  timestampToDate
} from "./helpers/common";
import { CallBase } from "@polkadot/types/types/calls";
import { AnyTuple } from "@polkadot/types/types/codec";
import { u64 } from "@polkadot/types";
import { allBlockExtrinsics } from './helpers/api';

export async function handleHistoryElement({
  store,
  event,
  block,
  extrinsic,
}: ExtrinsicContext & StoreContext): Promise<void> {

  const blockExtrinsic = await allBlockExtrinsics(block.height);

  blockExtrinsic.map((extrinisic) => {
    processExtrinisic(
      extrinisic as SubstrateExtrinsic,
      block,
      store
    )
  })
}

async function processExtrinisic(
  extrinsic: SubstrateExtrinsic,
  block: SubstrateBlock,
  store: DatabaseManager) {
  const isSigned = extrinsic.signature;
  if (isSigned) {
    let failedTransfers = findFailedTransferCalls(extrinsic, block)
    if (failedTransfers != null) {
      await saveFailedTransfers(failedTransfers, extrinsic, block, store)
    } else {
      await saveExtrinsic(extrinsic, block, store)
    }
  }
}


// async function saveFailedTransfers(
//   transfers: Transfer[],
//   extrinsic: SubstrateExtrinsic,
//   block: SubstrateBlock,
//   store: DatabaseManager): Promise<void> {
//   let promises = transfers.map(transfer => {
//       let extrinsicHash = extrinsic.hash
//       let blockNumber = block.height;
//       let extrinsicIdx = extrinsic.id
//       let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)
//       let blockTimestamp = timestamp(block);

//       const elementFrom = new HistoryElement({
//         id: extrinsicId+`-from`
//       });
//       elementFrom.address = transfer.from
//       elementFrom.blockNumber = blockNumber
//       elementFrom.extrinsicHash = extrinsicHash
//       elementFrom.extrinsicIdx = extrinsicIdx
//       elementFrom.timestamp = blockTimestamp
//       elementFrom.transfer = transfer

//       const elementTo = new HistoryElement({
//         id:extrinsicId+`-to`}
//         );
//       elementTo.address = transfer.to
//       elementTo.blockNumber = blockNumber
//       elementTo.extrinsicHash = extrinsicHash
//       elementTo.extrinsicIdx = extrinsicIdx
//       elementTo.timestamp = blockTimestamp
//       elementTo.transfer = transfer

//       return [store.save(elementTo), store.save(elementFrom)]
//   })
//   await Promise.allSettled(promises)
// }

async function saveExtrinsic(
  extrinsic: SubstrateExtrinsic,
  block: SubstrateBlock,
  store: DatabaseManager
): Promise<void> {
  let blockNumber = block.height;
  let extrinsicIdx = extrinsic.id
  let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)

  const element = new AccountHistory({
    id: extrinsicId
  });
  element.address = extrinsic.signer.toString()
  element.blockNumber = blockNumber
  element.extrinsicHash = extrinsic.hash
  element.timestamp = timestampToDate(block)
  element.item = new ExtrinsicItem({
    extrinsic: new Extrinsic({
      hash: extrinsic.hash,
      module: extrinsic.section,
      call: extrinsic.method,
      success: true, // extrinsic.success //recheck this
      //   fee: extrinsic.tip
      fee: calculateFeeAsString(extrinsic, false) as bigint
    })
  })

  //   new Extrinsic({
  //       hash: extrinsic.hash,
  //       module: extrinsic.section,
  //       call: extrinsic.method,
  //       success: true, // extrinsic.success //recheck this
  //       fee: calculateFeeAsString(extrinsic, false) as bigint
  //   })
  await store.save(element)
}


function saveFailedTransfers(failedTransfers: any, extrinsic: SubstrateExtrinsic, block: SubstrateBlock, store: DatabaseManager) {
  throw new Error('Function not implemented.');
}

function findFailedTransferCalls(extrinsic: SubstrateExtrinsic, block: SubstrateBlock) {
  throw new Error('Function not implemented.');
}
// /// Success Transfer emits Transfer event that is handled at Transfers.ts handleTransfer()
// function findFailedTransferCalls(
//   extrinsic: SubstrateExtrinsic,
//   block: SubstrateBlock): Transfer[] | null {
//   // if (extrinsic.success) {
//   //     return null;
//   // } recheck this

//   // let transferCallsArgs = determineTransferCallsArgs(extrinsic.method)
//   // if (transferCallsArgs.length == 0) {
//   //     return null;
//   // }

//   // let sender = extrinsic.signer
//   // return transferCallsArgs.map(tuple => {
//   //     let blockNumber = block.height;
//   //     return {
//   //         extrinsicHash: extrinsic.hash,
//   //         amount: tuple[1].toString(),
//   //         from: sender.toString(),
//   //         to: tuple[0],
//   //         blockNumber: blockNumber,
//   //         fee: calculateFeeAsString(extrinsic),
//   //         eventIdx: -1,
//   //         success: false
//   //     }
//   // })
//   return null
// }

// // function determineTransferCallsArgs(causeCall: CallBase<AnyTuple>) : [string, bigint][] {
// //   if (isTransfer(causeCall)) {
// //       return [extractArgsFromTransfer(causeCall)]
// //   } else if (isBatch(causeCall)) {
// //       return callsFromBatch(causeCall)
// //           .map(call => {
// //               return determineTransferCallsArgs(call)
// //                   .map((value, index, array) => {
// //                       return value
// //                   })
// //           })
// //           .flat()
// //   } else if (isProxy(causeCall)) {
// //       let proxyCall = callFromProxy(causeCall)
// //       return determineTransferCallsArgs(proxyCall)
// //   } else {
// //       return []
// //   }
// // }

// function extractArgsFromTransfer(call: CallBase<AnyTuple>): [string, bigint] {
//   const [destinationAddress, amount] = call.args

//   return [destinationAddress.toString(), (amount as u64).toBigInt()]
// }