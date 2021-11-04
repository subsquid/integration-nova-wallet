import { FeesPaid, Transfer } from '../generated/model';
import { Balances, Treasury } from '../types'
import {
  EventContext,
  StoreContext,
} from "@subsquid/hydra-common";
import { getOrCreate } from './helpers/helpers';

// Each transaction will have a transaction fee
// the transaction fee will be distributed to
// the block producer (20%) and rest will go 
// back to treasury (80%). So total fees for a 
// transaction would be Treasury Fees + 
// block producer fee

// we will be only calculating fees for balances.transfer requests

function isBalanceTransfer(method: String, section : String ) {
  return method === 'transfer' && section === 'balances'
}

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
  let feesPaid = await getOrCreate(
    store,
    FeesPaid,
    extrinsic.id
  )
 
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
  let test = extrinsic == undefined || !isBalanceTransfer(extrinsic.method, extrinsic.section)
  if (extrinsic == undefined || !isBalanceTransfer(extrinsic.method, extrinsic.section)){
    return
  }
  const [fee] = new Treasury.DepositEvent(event).params
  let feesPaid =  await getOrCreate(
    store,
    FeesPaid,
    extrinsic.id
  )
  
 feesPaid.fee =feesPaid.fee || 0n  +  fee.toBigInt()
 await store.save(feesPaid)
}