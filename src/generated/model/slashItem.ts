import assert from "assert"
import * as marshal from "../marshal"
import {Reward} from "./reward"

export class SlashItem {
  public readonly isTypeOf = 'SlashItem'
  private _slash!: Reward

  constructor(props?: Partial<Omit<SlashItem, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._slash = new Reward(undefined, marshal.nonNull(json.slash))
    }
  }

  get slash(): Reward {
    assert(this._slash != null, 'uninitialized access')
    return this._slash
  }

  set slash(value: Reward) {
    this._slash = value
  }

  toJSON(): object {
    return {
      isTypeOf: this.isTypeOf,
      slash: this.slash.toJSON(),
    }
  }
}
