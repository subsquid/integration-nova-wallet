import { FeesPaid, Transfer } from '../generated/model';
import { Balances, Treasury } from '../types'
import {
  DatabaseManager,
  EventContext,
  StoreContext,
  SubstrateBlock,
  SubstrateEvent,
  SubstrateExtrinsic,
} from "@subsquid/hydra-common";
import {
  blockNumber,
  eventId,
  calculateFeeAsString,
  timestamp,
} from "./helpers/common";
import { getOrCreate } from "./helpers/helpers";
import { bigint } from '../generated/marshal';

// Each transaction will have a transaction fee
// the transaction fee will be distributed to
// the block producer (20%) and rest will go 
// back to treasury (80%). So total fees for a 
// transaction would be Treasury Fees + 
// block producer fee



export async function handleBalanceDeposit({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [who, fee] = new Balances.DepositEvent(event).params
  let feesPaid = await store.get(FeesPaid, {
    where: { extrinisicIdx: extrinsic?.id  },
  })

  if (feesPaid == null) {
    feesPaid = new FeesPaid()
  }
  if(extrinsic == undefined){
    return
  }
  if(feesPaid.transfer == undefined){
    let transfer = await store.get(Transfer, {
     where: { extrinisicIdx: extrinsic?.id  },
   })
   if(transfer == null) return
   feesPaid.transfer = transfer
   }
 feesPaid.extrinisicIdx = extrinsic.id
 feesPaid.fee = feesPaid.fee || 0n + fee.toBigInt()
 feesPaid.blockProducerAddress = who.toString();

 await store.save(feesPaid)

}

export async function handleTreasuryDeposit({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [fee] = new Treasury.DepositEvent(event).params
  let feesPaid = await store.get(FeesPaid, {
    where: { extrinisicIdx: extrinsic?.id  },
  })

  if (feesPaid == null) {
    feesPaid = new FeesPaid()
  }
  if(extrinsic == undefined){
    return
  }
  if(feesPaid.transfer == undefined){
    let transfer = await store.get(Transfer, {
     where: { extrinisicIdx: extrinsic?.id  },
   })
   if(transfer == null) return
   feesPaid.transfer = transfer
   }
 feesPaid.fee =feesPaid.fee || 0n  +  fee.toBigInt()
 await store.save(feesPaid)
}