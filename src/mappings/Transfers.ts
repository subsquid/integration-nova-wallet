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

export async function handleTransfer({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
    const [from, to, value] = new Balances.TransferEvent(event).params

  const elementFrom = await getOrCreate(
    store,
    HistoryElement,
    eventId(event) + `-from`
  );
 elementFrom.address = from.toString();
await populateTransfer(elementFrom, event, block, extrinsic, store);

  const elementTo = await getOrCreate(
    store,
    HistoryElement,
    eventId(event) + `-to`
  );
  elementTo.address = to.toString();
  await populateTransfer(elementTo, event,block, extrinsic,store);
}

export async function handleTransferKeepAlive({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  await handleTransfer({ store, event, block, extrinsic });
}

async function populateTransfer(
  element: HistoryElement,
  event: SubstrateEvent,
  block : SubstrateBlock,
  extrinsic : SubstrateExtrinsic | undefined,
  store: DatabaseManager
): Promise<void> {
  element.timestamp = timestamp(block);
  element.blockNumber = blockNumber(event);
  if (extrinsic !== undefined) {
    element.extrinsicHash = extrinsic.hash;
    element.extrinsicIdx = extrinsic.id;
  }
  const [from, to, value] = new Balances.TransferEvent(event).params
  element.transfer = new Transfer ({
    amount: value.toString(),
    from: from.toString(),
    to: to.toString(),
    fee: calculateFeeAsString(event.extrinsic),
    eventIdx: event.id,
    success: true
  });
  await store.save(element);
}
