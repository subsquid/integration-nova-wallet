import {RewardItem} from "./rewardItem"
import {ExtrinsicItem} from "./extrinsicItem"
import {TransferItem} from "./transferItem"
import {SlashItem} from "./slashItem"

export type AccountHistoryItem = RewardItem | ExtrinsicItem | TransferItem | SlashItem

export function fromJsonAccountHistoryItem(json: any): AccountHistoryItem {
  switch(json?.isTypeOf) {
    case 'RewardItem': return new RewardItem(undefined, json)
    case 'ExtrinsicItem': return new ExtrinsicItem(undefined, json)
    case 'TransferItem': return new TransferItem(undefined, json)
    case 'SlashItem': return new SlashItem(undefined, json)
    default: throw new TypeError('Unknown json object passed as AccountHistoryItem')
  }
}
