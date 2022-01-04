import { SubstrateBlock, SubstrateEvent, SubstrateExtrinsic } from '@subsquid/hydra-common'
import { encodeAddress } from "@polkadot/util-crypto";
import { BlockEvent,allBlockEvents, BlockExtrinisic } from './api';
import { mapExtrinisicToFees } from './helpers';
import { ADDRESS_PREFIX, EXTRINISIC_BLACK_LIST } from '../../constants';
const batchCalls = ["batch", "batchAll"]
const transferCalls = ["transfer", "transferKeepAlive"]


export function convertAddress(address: string, prefix = ADDRESS_PREFIX){
  if(!address) return ''
  try{
   return encodeAddress(address,prefix)
  }catch(err){
    return ""
  };
}

export function removeBlackListedExtrinsic(
  extrinsic: Array<BlockExtrinisic>,
  whiteList = EXTRINISIC_BLACK_LIST
  ){
const newList = extrinsic.filter((value: BlockExtrinisic) => !whiteList.has(value.name))
return newList
}

export function constructCache<T extends BlockExtrinisic| BlockEvent>(
  list : Array<T> 
  ):Map<string,  Array<T>>
  {
    let cache: Map<string,  Array<T>> = new Map()
    list.map((element: T ) => {
      let array = cache.get(`${element.blockNumber}`) || []
      array?.push(element)
      cache.set(`${element.blockNumber}`,array)
    })
    return cache
  }

export function convertAddressToSubstrate(address: string) : string {
    return encodeAddress(address, 42);
}
export function isBatch(call:BlockExtrinisic) : boolean {
    return call.section == "utility" && batchCalls.includes(call.method)
}

export function isProxy(call:BlockExtrinisic) : boolean {
    return call.section == "proxy" && call.method == "proxy"
}

export function isTransfer(call:BlockExtrinisic) : boolean {
    return call.section == "balances" && transferCalls.includes(call.method)
}

export function callsFromBatch(batchCall:BlockExtrinisic){
    let calls:any = batchCall.args[0]
    return calls.value
}

export function callFromProxy(proxyCall:BlockExtrinisic) {
    // return proxyCall.args[2] as SubstrateExtrinsic
    return proxyCall.args[2]
}

export function eventId(event: SubstrateEvent | BlockEvent): string {
    return eventIdFromBlockAndIdx(parseInt(`${event.blockNumber}`), event.id)
}

export function eventIdFromBlockAndIdx(blockNumber: number, eventIdx: string) {
    return `${blockNumber}-${eventIdx}`
}

// export function extrinsicIdx(event: SubstrateEvent): string {
//     let idx: string = event.extrinsic ? event.extrinsic.idx.toString() : event.idx.toString()
//     return idx 
// }

export function blockNumber(event: SubstrateEvent): number {
    return event.blockNumber
}

export function extrinsicIdFromBlockAndIdx(blockNumber: number, extrinsicIdx: string): string {
    return `${blockNumber.toString()}-${extrinsicIdx}`
}

export function timestamp(block: SubstrateBlock): bigint {
    return  BigInt(Math.round((block.timestamp / 1000)))
}

export function timestampToDate(block: SubstrateBlock): Date {
    return  new Date(block.timestamp)
}


let blockFeesCache: { [blockNumber: number]: mapExtrinisicToFees } = {};
/**
 * Creates a hash map to find the fees events for
 * an extrinisic
 * @param {number} blockNumber
 * @returns <mapExtrinisicToFees>
 */
export async function feeEventsToExtrinisicMap(
  blockNumber: number,
):Promise< mapExtrinisicToFees> {
  if (blockFeesCache[blockNumber]) {
    return blockFeesCache[blockNumber];
  }
  blockFeesCache = {};
  let extrinisicMap: mapExtrinisicToFees = {};
  const events = await allBlockEvents(blockNumber);
  events.map((entity: BlockEvent) => {
    let extrinsicId = entity.extrinsicId;
    if(!extrinsicId){
      return
    }
    let method = entity.method;
    let section = entity.section;
    extrinisicMap[extrinsicId] = extrinisicMap[extrinsicId] || {}
    if (
      extrinsicId &&
      method === "Deposit" &&
      (section === "balances" || section === "treasury" || section ==="Withdraw")
    ) {
      extrinisicMap[extrinsicId][section] =  section === "treasury" ? BigInt(
        entity?.data?.param0?.value || 0n
      ) : BigInt(
        entity?.data?.param1?.value || 0n
      );
    }
  });
  blockFeesCache[blockNumber] = extrinisicMap
  return blockFeesCache[blockNumber];
}

/**
 * Calculates total for a given extrinsic
 * @param {BlockExtrinisic} extrinsic 
 * @param {mapExtrinisicToFees} feeEvents 
 * @returns {BigInt}
 */
export function calculateFee(
    extrinsic: BlockExtrinisic,
    feeEvents: mapExtrinisicToFees): bigint {

    if (extrinsic?.id) {
       let totalFee = 0n
        let balancesFee = feeEvents[extrinsic.id]?.balances || 0n
        let treasureFee = feeEvents[extrinsic.id]?.treasury || 0n

        // Applicable from spec 9122
        let withdraw = feeEvents[extrinsic.id]?.Withdraw || 0n
        totalFee = withdraw ? withdraw :balancesFee + treasureFee

        return totalFee
    }

    return 0n;
}

/**
 * Find whether the extrinsic is successful or not
 * @param {BlockExtrinisic} extrinsic 
 * @returns {Boolean}
 */
export function isExtrinisicSuccess( extrinsic: BlockExtrinisic): boolean {
  return !extrinsic.substrate_events.some((element) => {
    return element.name === "utility.BatchInterrupted" || 
    element.name === "system.ExtrinsicFailed"
  })
}


export function determineTransferCallsArgs(
  extrinsic: BlockExtrinisic
): [string, bigint][] {
  if (isTransfer(extrinsic)) {
    return [extractArgsFromTransfer(extrinsic)];
  } else if (isBatch(extrinsic)) {
    return callsFromBatch(extrinsic)
      .map((call: any) => {
        return determineTransferCallsArgs(call).map((value, index, array) => {
          return value;
        });
      })
      .flat();
  } else if (isProxy(extrinsic)) {
    let proxyCall = callFromProxy(extrinsic);
    return determineTransferCallsArgs(proxyCall);
  } else {
    return [];
  }
}

function extractArgsFromTransfer(call: BlockExtrinisic): [string, bigint] {
  const [destinationAddress, amount] = call.args;
  return [convertAddress(
    destinationAddress?.value?.id?.toString() || destinationAddress?.value?.toString()  ) 
    || '', BigInt(amount?.value || 0)];
}
