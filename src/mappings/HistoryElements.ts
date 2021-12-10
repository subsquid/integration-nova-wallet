import {
  DatabaseManager,
  ExtrinsicContext,
  StoreContext,
  SubstrateExtrinsic,
  SubstrateBlock,
} from "@subsquid/hydra-common";
import {
  AccountHistory,
  Extrinsic,
  ExtrinsicItem,
  Transfer,
  TransferItem,
} from "../generated/model";
import {
  callFromProxy,
  callsFromBatch,
  calculateFee,
  extrinsicIdFromBlockAndIdx,
  isBatch,
  isProxy,
  isTransfer,
  timestampToDate,
  feeEventsToExtrinisicMap,
  isExtrinisicSuccess,
  removeBlackListedExtrinsic,
  convertAddress,
} from "./helpers/common";
import { getOrCreate, get, mapExtrinisicToFees } from "./helpers/helpers";
import {
  BlockExtrinisic,
  allBlockExtrinsics,
} from "./helpers/api";

export async function handleHistoryElement({
  store,
  block,
}: ExtrinsicContext & StoreContext): Promise<void> {
  const extrinsics = await allBlockExtrinsics(block.height);
  const allExtrinsic = removeBlackListedExtrinsic(extrinsics)
  if(allExtrinsic.length == 0){
    return
  }
  const fees = await feeEventsToExtrinisicMap(block.height);
  if (allExtrinsic.length == 0) {
    return;
  }
  // Check all block extrinsics
  let extrinisicItemPromises = allExtrinsic.map(
    async (extrinisicItem: BlockExtrinisic) => {
      const isSigned = extrinisicItem.signature;
      if (isSigned) {
        let failedTransfer = await findFailedTransferCalls(
          extrinisicItem,
          fees,
          block,
          store
        );
        if (failedTransfer != null  ) {
          await saveFailedTransfer(
            failedTransfer,
            extrinisicItem,
            fees,
            block,
            store
          );
        } else {
          return saveExtrinsic(extrinisicItem,fees, block, store);
        }
      }
    }
  );

  while (extrinisicItemPromises.length > 0) {
    const batch = extrinisicItemPromises.splice(0, 100);
    await Promise.all(batch);
  }
}

async function saveFailedTransfer(
  transfers: Transfer[],
  extrinsic: BlockExtrinisic,
  fees: mapExtrinisicToFees,
  block: SubstrateBlock,
  store: DatabaseManager
): Promise<void> {
  let promises = transfers.map(async (transfer) => {
    transfer.fee = calculateFee(
        extrinsic,
        fees
        )
    await store.save(transfer);
    let extrinsicHash = extrinsic.hash;
    let blockNumber = block.height;
    let extrinsicIdx = extrinsic.id;
    let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx);
    let blockTimestamp = timestampToDate(block);

    const elementFrom = await getOrCreate(
      store,
      AccountHistory,
      extrinsicId + `-from`
    );
    elementFrom.address = convertAddress(transfer.from);
    elementFrom.blockNumber = blockNumber;
    elementFrom.extrinsicHash = extrinsicHash;
    elementFrom.extrinsicIdx = extrinsicIdx;
    elementFrom.timestamp = blockTimestamp;
    elementFrom.item = new TransferItem({
      transfer: transfer.id
    });

    const elementTo = await getOrCreate(
      store,
      AccountHistory,
      extrinsicId + `-to`
    );
    elementTo.address = convertAddress(transfer.to);
    elementTo.blockNumber = blockNumber;
    elementTo.extrinsicHash = extrinsicHash;
    elementTo.extrinsicIdx = extrinsicIdx;
    elementTo.timestamp = blockTimestamp;
    elementTo.item = new TransferItem({
      transfer: transfer.id,
    });

    return [store.save(elementFrom), store.save(elementTo)];
  });
  await Promise.allSettled(promises);
}

async function saveExtrinsic(
  extrinsic: BlockExtrinisic,
  fees: mapExtrinisicToFees,
  block: SubstrateBlock,
  store: DatabaseManager
): Promise<void> {
  let blockNumber = block.height;
  let extrinsicIdx = extrinsic.id;
 
  if(extrinsic.name === 'balances.transferKeepAlive' || extrinsic.name === 'balances.transfer')
   return; // Already processed in transfers
  let extrinsicId = extrinsicIdFromBlockAndIdx(blockNumber, extrinsicIdx);
  let checkIfPresent = await get(store, AccountHistory, extrinsicId);
  if (checkIfPresent?.id) {
    // already processed
    return;
  }

  const element = new AccountHistory({
    id: extrinsicId,
  });
  element.address = convertAddress(extrinsic.signer.toString());
  element.blockNumber = blockNumber;
  element.extrinsicHash = extrinsic.hash;
  element.extrinsicIdx = extrinsicId;
  element.timestamp = timestampToDate(block);

  const success = isExtrinisicSuccess(extrinsic)
  extrinsic.tip = BigInt(extrinsic.tip);
  const newExtrinsic = new Extrinsic({
    hash: extrinsic.hash || "",
    module: extrinsic.section,
    call: extrinsic.method,
    success: success,
    fee:  calculateFee(extrinsic, fees),
  });
  element.item = new ExtrinsicItem({
    extrinsic: newExtrinsic,
  });
  return store.save(element);
}

/// Success Transfer emits Transfer event that is handled at Transfers.ts handleTransfer()
async function findFailedTransferCalls(
  extrinsic: BlockExtrinisic,
  fees: mapExtrinisicToFees,
  block: SubstrateBlock,
  store: DatabaseManager
): Promise<Transfer[] | null> {

  const success = isExtrinisicSuccess(extrinsic)
  if (
    success
  ) {
    return null;
  }

  let transferCallsArgs = determineTransferCallsArgs(extrinsic);
  if (transferCallsArgs.length == 0) {
    return null;
  }
  let transferEventID = extrinsic.substrate_events.find(element =>
     element.name === 'balances.Transfer')?.id
  let sender = extrinsic.signer;
  return transferCallsArgs.map((tuple) => {
    return new Transfer({
      extrinisicIdx: extrinsic.id,
      amount: tuple[1].toString(),
      from: convertAddress(sender.toString()),
      to: convertAddress(tuple[0].toString()),
      fee:  calculateFee(extrinsic, fees),
      eventIdx: "-1",
      success: false,
      id: `${transferEventID}`,
    });
  });
}

function determineTransferCallsArgs(
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
    destinationAddress?.value?.id?.toString() || destinationAddress?.value?.toString()) 
    || '', BigInt(amount?.value || 0)];
}
