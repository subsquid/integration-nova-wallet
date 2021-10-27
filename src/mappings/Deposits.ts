import { FeesPaid, Transfer } from '../generated/model';
import { Balances, Treasury } from '../types'
import {
  EventContext,
  StoreContext,
} from "@subsquid/hydra-common";

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
  if(extrinsic == undefined){
    return
  }
  const [who, fee] = new Balances.DepositEvent(event).params
  let feesPaid = await store.get(FeesPaid, {
    where: { id: extrinsic?.id  },
  })

  if (feesPaid == null) {
    return
  }
 
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
  
  if(extrinsic == undefined){
    return
  }
  const [fee] = new Treasury.DepositEvent(event).params
  let feesPaid = await store.get(FeesPaid, {
    where: { id: extrinsic?.id  },
  })

  if (feesPaid == null) {
    return
  }
  
 feesPaid.fee =feesPaid.fee || 0n  +  fee.toBigInt()
 await store.save(feesPaid)
}