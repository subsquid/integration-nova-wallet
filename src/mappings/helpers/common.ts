import { BlockContext, DatabaseManager, EventContext, StoreContext, SubstrateBlock, SubstrateEvent, SubstrateExtrinsic } from '@subsquid/hydra-common'
import {Balance} from "@polkadot/types/interfaces";
import {CallBase} from "@polkadot/types/types/calls";
import {AnyTuple} from "@polkadot/types/types/codec";
import { Vec } from '@polkadot/types';
import { encodeAddress } from "@polkadot/util-crypto";
import { allBlockExrinisics } from './api';
const batchCalls = ["batch", "batchAll"]
const transferCalls = ["transfer", "transferKeepAlive"]

// export function distinct<T>(array: Array<T>): Array<T> {
//     return [...new Set(array)];
// }

export function convertAddressToSubstrate(address: string) : string {
    return encodeAddress(address, 42);
}
export function isBatch(call:allBlockExrinisics) : boolean {
    return call.section == "utility" && batchCalls.includes(call.method)
}

export function isProxy(call:allBlockExrinisics) : boolean {
    return call.section == "proxy" && call.method == "proxy"
}

export function isTransfer(call:SubstrateExtrinsic) : boolean {
    return call.section == "balances" && transferCalls.includes(call.method)
}

export function callsFromBatch(batchCall:allBlockExrinisics){
    let calls:any = batchCall.args[0]
    return calls.value
}

export function callFromProxy(proxyCall:allBlockExrinisics) {
    // return proxyCall.args[2] as SubstrateExtrinsic
    return proxyCall.args[2]
}

export function eventId(event: SubstrateEvent): string {
    return `${blockNumber(event)}-${event.id}`
}

export function eventIdFromBlockAndIdx(blockNumber: string, eventIdx: string) {
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

export function calculateFeeAsString(extrinsic?: SubstrateExtrinsic): string {
// query MyQuery {
//   substrate_extrinsic(where: {hash: {_eq: "0x5430d945838c8dc84eba9988303b79e8e8a638c45dc2711815712b9f06294116"}}) {
//     id
//     name
//     section
//     event {
//       extrinsicName
//       extrinsicIndex
//       name
//       method
//       data
//       extrinsicId
//       params
//       section
//     }
//   }
// }

    if (extrinsic) {
        let balancesFee = exportFeeFromBalancesDepositEvent(extrinsic)
        let treasureFee = exportFeeFromTreasureDepositEvent(extrinsic)

        let totalFee = balancesFee + treasureFee
        return totalFee.toString()
    } else {
        return BigInt(0).toString()
    } 
}

function exportFeeFromBalancesDepositEvent(extrinsic: SubstrateExtrinsic): bigint {
    const eventRecord:any = undefined 
    // extrinsic.events.find((event) => {
    //     return event.event.method == "Deposit" && event.event.section == "balances"
    // })

    if (eventRecord != undefined) {
        const {event: {data: [, fee]}}= eventRecord

        return (fee as Balance).toBigInt()
    } else  {
        return BigInt(0)
    }
}

function exportFeeFromTreasureDepositEvent(extrinsic: SubstrateExtrinsic): bigint {
    const eventRecord:any = undefined
    // extrinsic.events.find((event) => {
    //     return event.event.method == "Deposit" && event.event.section == "treasury"
    // })

    if (eventRecord != undefined) {
        const {event: {data: [fee]}}= eventRecord

        return (fee as Balance).toBigInt()
    } else  {
        return BigInt(0)
    }
}
