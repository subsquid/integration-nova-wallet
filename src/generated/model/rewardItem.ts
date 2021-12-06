import assert from "assert"
import * as marshal from "../marshal"
import {Reward} from "./reward"

export class RewardItem {
  public readonly isTypeOf = 'RewardItem'
  private _reward!: Reward

  constructor(props?: Partial<Omit<RewardItem, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._reward = new Reward(undefined, marshal.nonNull(json.reward))
    }
  }

  get reward(): Reward {
    assert(this._reward != null, 'uninitialized access')
    return this._reward
  }

  set reward(value: Reward) {
    this._reward = value
  }

  toJSON(): object {
    return {
      isTypeOf: this.isTypeOf,
      reward: this.reward.toJSON(),
    }
  }
}
