import { HistoryElement, Transfer } from '../generated/model';
import { Balances } from '../types'
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

export async function handleBalanceDeposit({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
    
console.log(event)
//   const elementFrom = await getOrCreate(
//     store,
//     HistoryElement,
//     eventId(event) + `-from`
//   );
//  elementFrom.address = from.toString()

}