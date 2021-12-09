import {
  AccumulatedReward,
  Reward,
  AccountHistory,
  RewardItem,
  SlashItem,
} from "../generated/model";
import {
  DatabaseManager,
  EventContext,
  StoreContext,
  SubstrateBlock,
  SubstrateEvent,
} from "@subsquid/hydra-common";
import {
  convertAddress,
  eventId,
  timestampToDate,
} from "./helpers/common";
import { Balance } from "@polkadot/types/interfaces";
import {
  handleRewardRestakeForAnalytics,
  handleSlashForAnalytics,
} from "./StakeChanged";
import { cachedRewardDestination, cachedController } from "./helpers/Cache";
import { Staking } from "../types";
import { BlockEvent, apiService } from "./helpers/api";

export async function handleRewarded({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  await handleReward({
    store,
    event,
    block,
    extrinsic,
  });
}

export async function handleReward({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  // keep track of stake changes that is happening
  // for addresses across block
  await handleRewardRestakeForAnalytics({
    store,
    event,
    block,
    extrinsic,
  });

  await handleAccountRewardTxHistory({
    store,
    event,
    block,
    extrinsic,
  });

  // Increments reward balance for an account
  await updateAccumulatedReward(store, event, true);
}

async function handleAccountRewardTxHistory({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [account, amount] = new Staking.RewardedEvent(event).params;
  const accountAddress =account.toString();

  let element = new AccountHistory({
    id: eventId(event),
  });
  let validator = "",
    stash = "",
    era = -1;

  if (extrinsic?.method == "payoutStakers") {
    let params = new Staking.Payout_stakersCall(extrinsic);
    era = params.era.toNumber();
    validator = params.validator_stash.toString();
  } else if (extrinsic?.method == "payoutValidator") {
    let params = new Staking.Payout_validatorCall(extrinsic);
    era = params.era.toNumber();
    validator = extrinsic.signer.toString();
  } else if (extrinsic?.method == "payoutNominator") {
    // @todo to check case for payoutNominator
    let params = new Staking.Payout_nominatorCall(extrinsic);
    era = params.era.toNumber();
    validator = "";
  }

  // Reward destination may not be the same as the account from the event param
  // need to call the storage function payee and check the below conditions
  // to correctly identify the destination

  let rewardDestination = await cachedRewardDestination(
    accountAddress,
    event as SubstrateEvent,
    block
  );

  if (rewardDestination.isStaked || rewardDestination.isStash) {
    stash = accountAddress;
  } else if (rewardDestination.isController) {
    stash = await cachedController(
      accountAddress,
      event as SubstrateEvent,
      block
    );
  } else if (rewardDestination.isAccount) {
    stash = rewardDestination.asAccount.toString();
  }

  element.address = convertAddress(account.toString());
  element.blockNumber = block.height;
  element.extrinsicHash = extrinsic?.hash;
  element.timestamp = timestampToDate(block);
  element.item = new RewardItem({
    reward: new Reward({
      amount: amount.toBigInt(),
      era: era,
      eventIdx: event.id.toString(),
      validator: convertAddress(validator),
      stash: convertAddress(stash),
    }),
  });

  await store.save(element);
}

export async function handleSlashed({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  await handleSlash({
    store,
    event,
    block,
    extrinsic,
  });
}

export async function handleSlash({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  await handleSlashForAnalytics({
    store,
    event,
    block,
    extrinsic,
  });
  await handleSlashForAccountTxHistory({
    store,
    event,
    block,
    extrinsic,
  });
  // Decrements reward balance for an account
  await updateAccumulatedReward(store, event, false);
}

let validatorsCache: { [blockNumber: number]: [string[], number] } = {};
let initialValidator: string = "";

async function getValidators(block: SubstrateBlock): Promise<[string[], number]> {
  if (validatorsCache[block.height]) return validatorsCache[block.height];
  // clear cache
  validatorsCache = {};
  initialValidator = "";

  const apiAt = await apiService(block.hash)

  let era = ((await apiAt.query.staking.currentEra()).toJSON())
  let currentEra = typeof era === 'number' ? era : -1
  const slashDeferDuration = await apiAt.consts.staking.slashDeferDuration;
  const slashEra =
    slashDeferDuration == undefined
      ? currentEra
      : currentEra - (slashDeferDuration && slashDeferDuration.toNumber());
  //recheck
  
  const eraStakersInSlashEra = apiAt.query.staking.erasStakersClipped 
  ? await apiAt.query.staking.erasStakersClipped.entries(slashEra) : [];
  const validatorsInSlashEra = eraStakersInSlashEra.map(([key, exposure]) => {
    let [, validatorId] = key.args;

    return validatorId.toString();
  });
  validatorsCache[block.height] = [validatorsInSlashEra, slashEra];
  return validatorsCache[block.height];
}

async function handleSlashForAccountTxHistory({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  let isPresent: Array<AccountHistory> = await store.find(
    AccountHistory, // recheck
    {
      where: { id: eventId(event) },
    }
  );
  if (isPresent.length !== 0) {
    // already processed reward previously
    return;
  }
  const element = new AccountHistory({
    id: eventId(event),
  });

  const [account, amount] = new Staking.SlashedEvent(event).params;
 let address = account.toString()
 

  // Need rechecking
  const getValidatorData = await getValidators(block);
  const validatorsSet = new Set(await getValidatorData[0]);
  initialValidator = validatorsSet.has(address)
    ? address
    : initialValidator;
    element.address = convertAddress(address);
    element.blockNumber = block.height;
    element.extrinsicHash = extrinsic?.hash;
    element.timestamp = timestampToDate(block);
  element.item = new SlashItem({
    slash: new Reward({
      amount: amount.toBigInt(),
      era: getValidatorData[1],
      eventIdx: event.id.toString(),
      validator: convertAddress(initialValidator),
      stash: convertAddress(address),
    }),
  });

  await store.save(element);
}

async function updateAccumulatedReward(
  store: DatabaseManager,
  event: SubstrateEvent,
  isReward: boolean
): Promise<void> {
  // For both reward and slash, the params are parsed the same way
  const [accountId, amount] = new Staking.RewardedEvent(event).params;

  let accountAddress = convertAddress(accountId.toString());

  let accumulatedReward = await store.get(AccumulatedReward, {
    where: { id: accountAddress },
  });

  if (accumulatedReward == null) {
    accumulatedReward = new AccumulatedReward({
      id: accountAddress,
    });
    accumulatedReward.amount = BigInt(0);
  }
  const newAmount = (amount as Balance).toBigInt();
  accumulatedReward.amount =
    accumulatedReward.amount + (isReward ? newAmount : -newAmount);
  await store.save(accumulatedReward);
}
