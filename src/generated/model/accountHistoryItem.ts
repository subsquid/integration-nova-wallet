import {RewardItem} from "./rewardItem"
import {ExtrinsicItem} from "./extrinsicItem"
import {TransferItem} from "./transferItem"

export type AccountHistoryItem = RewardItem | ExtrinsicItem | TransferItem

export function fromJsonAccountHistoryItem(json: any): AccountHistoryItem {
  switch(json?.isTypeOf) {
    case 'RewardItem': return new RewardItem(undefined, json)
    case 'ExtrinsicItem': return new ExtrinsicItem(undefined, json)
    case 'TransferItem': return new TransferItem(undefined, json)
    default: throw new TypeError('Unknown json object passed as AccountHistoryItem')
  }
}
