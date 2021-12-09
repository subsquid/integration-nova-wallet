import {
  DatabaseManager,
  EventContext,
  StoreContext,
  SubstrateBlock,
  SubstrateEvent,
  SubstrateExtrinsic,
} from "@subsquid/hydra-common";

import {  AccountHistory, Transfer, TransferItem } from '../generated/model';
import { Balances } from '../types'
import {
  blockNumber,
  calculateFee,
  convertAddress,
  eventId,
  feeEventsToExtrinisicMap,
  timestampToDate,
} from "./helpers/common";
import { getOrCreate } from "./helpers/helpers";
import { BlockExtrinisic } from './helpers/api';
import { ADDRESS_PREFIX } from "../constants";

export async function handleTransfer({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [from, to, value] = new Balances.TransferEvent(event).params

  const elementFrom = await getOrCreate(
    store,
    AccountHistory,
    eventId(event) + `-from`
  );
  elementFrom.address = convertAddress(from.toString());
  await populateTransfer(elementFrom, event, block, extrinsic, store);

  const elementTo = await getOrCreate(
    store,
    AccountHistory,
    eventId(event) + `-to`
  );
  elementTo.address = convertAddress(to.toString());
  await populateTransfer(elementTo, event, block, extrinsic, store);
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
  element: AccountHistory,
  event: SubstrateEvent,
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic | undefined,
  store: DatabaseManager
): Promise<void> {
  element.timestamp = timestampToDate(block);
  element.blockNumber = blockNumber(event);
  if (extrinsic !== undefined && extrinsic !== null) {
    element.extrinsicHash = extrinsic.hash;
    element.extrinsicIdx = extrinsic.id;
  }
  const [from, to, value] = new Balances.TransferEvent(event).params
  const fees = await feeEventsToExtrinisicMap(block.height);
  let transfer: Transfer | undefined = await store.get(Transfer, {
    where: { extrinisicIdx: extrinsic?.id },
  })
  if (transfer == null) {
    transfer = new Transfer()
  }

  if (extrinsic?.id == undefined) {
    console.error(`extrinisic id undefined for transfer with event id = ${event.id}.Skipping it `)
    return
  }
  transfer.amount = value.toString();
  transfer.from = convertAddress(from.toString());
  transfer.to =  convertAddress(to.toString())
  transfer.fee = calculateFee(extrinsic as BlockExtrinisic,fees);
  transfer.extrinisicIdx = extrinsic?.id;
  transfer.eventIdx = event.id;
  transfer.success = true;
  transfer.id = event.id
  await store.save(transfer);

  element.item = new TransferItem({
    transfer: transfer.id
  })
  await store.save(element);
}
