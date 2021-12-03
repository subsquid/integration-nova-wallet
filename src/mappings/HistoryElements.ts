import {DatabaseManager,ExtrinsicContext, StoreContext, SubstrateExtrinsic, SubstrateBlock} from '@subsquid/hydra-common'
import {AccountHistory, Extrinsic, ExtrinsicItem, FeesPaid, Transfer, TransferItem} from "../generated/model";
import {
    callFromProxy, callsFromBatch,
    calculateFeeAsString,
    extrinsicIdFromBlockAndIdx, isBatch, isProxy,
    isTransfer,
    timestampToDate,
} from "./helpers/common";
import {u64} from "@polkadot/types";
import { getOrCreate, get } from './helpers/helpers';
import { allBlockExtrinisics, allBlockExtrinsics } from './helpers/api';

export async function handleHistoryElement({
    store,
    event,
    block,
    extrinsic,
  }: ExtrinsicContext & StoreContext): Promise<void> {
    const allExtrinsic = await allBlockExtrinsics(block.height)
    if(allExtrinsic.length == 0){
      return
    }
    // Check all block extrinisics
    let extrinisicItemPromises = allExtrinsic.map(async (extrinisicItem: allBlockExtrinisics) =>{
      const isSigned  = extrinisicItem.signature;
      if (isSigned) {
          let failedTransfers = await findFailedTransferCalls(extrinisicItem, block, store)
          if (failedTransfers != null) {
            await saveFailedTransfers(failedTransfers, extrinisicItem, block, store)
          } else {
            return saveExtrinsic(extrinisicItem, block, store)
          }
      }
    })

    while(extrinisicItemPromises.length > 0) {
        const batch = extrinisicItemPromises.splice(0, 100)
        await Promise.all(batch)
    }
}

async function saveFailedTransfers(
    transfers: Transfer[],
    extrinsic: allBlockExtrinisics,
    block: SubstrateBlock,
    store: DatabaseManager): Promise<void> {
    let promises = transfers.map(async transfer => {
        await store.save(transfer)
        let extrinsicHash = extrinsic.hash;
        let blockNumber = block.height
        let extrinsicIdx = extrinsic.id
        let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)
        let blockTimestamp = timestampToDate(block);

        const elementFrom =  await getOrCreate(store, AccountHistory,extrinsicId+`-from`)
        elementFrom.address = transfer.from
        elementFrom.blockNumber = blockNumber
        elementFrom.extrinsicHash = extrinsicHash
        elementFrom.extrinsicIdx = extrinsicIdx
        elementFrom.timestamp = blockTimestamp
        elementFrom.item = new TransferItem({
          transfer: transfer.id
        })  

        const elementTo = await getOrCreate(store, AccountHistory,extrinsicId+`-to`)
        elementTo.address = transfer.to
        elementTo.blockNumber = blockNumber
        elementTo.extrinsicHash = extrinsicHash
        elementTo.extrinsicIdx = extrinsicIdx
        elementTo.timestamp = blockTimestamp
        elementTo.item = new TransferItem({
          transfer: transfer.id
        })  

        return [ store.save(elementFrom),store.save(elementTo)]
    })
    await Promise.allSettled(promises)
}

async function saveExtrinsic(extrinsic: allBlockExtrinisics, block : SubstrateBlock, store: DatabaseManager): Promise<void> {
    let blockNumber = block.height;
    let extrinsicIdx = extrinsic.id
    let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx)
    let checkIfPresent = await get(
        store,
        AccountHistory,
        extrinsicId
    )
    if(checkIfPresent?.id){
        // already processed
        return
    }

    const element = new AccountHistory({
      id: extrinsicId
    });
    element.address = extrinsic.signer.toString()
    element.blockNumber = blockNumber
    element.extrinsicHash = extrinsic.hash
    element.extrinsicIdx = extrinsicId
    element.timestamp = timestampToDate(block)

    const success = (extrinsic.substrate_events.name === 'utility.BatchInterrupted') || (extrinsic.substrate_events.name === 'system.ExtrinsicFailed') ? false : true
    extrinsic.tip = BigInt(extrinsic.tip)
    const newExtrinsic = new Extrinsic(
      {
        hash: extrinsic.hash || '',
        module: extrinsic.section,
        call: extrinsic.method,
        success: success, 
        fee: BigInt(await calculateFeeAsString(extrinsic as SubstrateExtrinsic))
    })
    element.item = new ExtrinsicItem( {
      extrinsic: newExtrinsic
    })
    return store.save(element)
}

/// Success Transfer emits Transfer event that is handled at Transfers.ts handleTransfer()
async function findFailedTransferCalls( 
    extrinsic: allBlockExtrinisics,
    block: SubstrateBlock,
    store: DatabaseManager): Promise<Transfer[] | null> {

    if ((extrinsic.substrate_events.name === 'utility.BatchCompleted') || (extrinsic.substrate_events.name === 'system.ExtrinsicSuccess')) {
        return null;
    }

    let transferCallsArgs = determineTransferCallsArgs(extrinsic)
    if (transferCallsArgs.length == 0) {
        return null;
    }

    let sender = extrinsic.signer
    const feesPaid = await getOrCreate(
      store,
      FeesPaid,
      extrinsic.id
    );
    feesPaid.fee = feesPaid.fee || 0n;
    feesPaid.blockProducerAddress = feesPaid.blockProducerAddress || ''
    await store.save(feesPaid);
    return transferCallsArgs.map(tuple => {
        return new Transfer({
            extrinisicIdx: extrinsic.id,
            amount: tuple[1].toString(),
            from: sender.toString(),
            to: tuple[0].toString(),
            fee: feesPaid,
            eventIdx: '-1',
            success: false,
            id: `${extrinsic.substrate_events.id}`
        })
    })
}

function determineTransferCallsArgs(extrinsic: allBlockExtrinisics ) : [string, bigint][] {
    if (isTransfer(extrinsic)) {
        return [extractArgsFromTransfer(extrinsic)]
    } else if (isBatch(extrinsic)) {
        return callsFromBatch(extrinsic)
            .map((call:any) => {
                return determineTransferCallsArgs(call)
                    .map((value, index, array) => {
                        return value
                    })
            })
            .flat()
    } else if (isProxy(extrinsic)) {
        let proxyCall = callFromProxy(extrinsic)
        return determineTransferCallsArgs(proxyCall)
    } else {
        return []
    }
}

function extractArgsFromTransfer(call: allBlockExtrinisics): [string, bigint] {
    const [destinationAddress, amount] = call.args
    return [destinationAddress.toString(), BigInt(amount?.value || amount)]
}
