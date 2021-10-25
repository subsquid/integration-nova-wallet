import assert from "assert"
import * as marshal from "../marshal"

export class Reward {
  private _eventIdx!: number
  private _amount!: string
  private _isReward!: boolean
  private _era!: number | undefined | null
  private _stash!: string | undefined | null
  private _validator!: string | undefined | null

  constructor(props?: Partial<Omit<Reward, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._eventIdx = marshal.int.fromJSON(json.eventIdx)
      this._amount = marshal.string.fromJSON(json.amount)
      this._isReward = marshal.boolean.fromJSON(json.isReward)
      this._era = json.era == null ? undefined : marshal.int.fromJSON(json.era)
      this._stash = json.stash == null ? undefined : marshal.string.fromJSON(json.stash)
      this._validator = json.validator == null ? undefined : marshal.string.fromJSON(json.validator)
    }
  }

  get eventIdx(): number {
    assert(this._eventIdx != null, 'uninitialized access')
    return this._eventIdx
  }

  set eventIdx(value: number) {
    this._eventIdx = value
  }

  get amount(): string {
    assert(this._amount != null, 'uninitialized access')
    return this._amount
  }

  set amount(value: string) {
    this._amount = value
  }

  get isReward(): boolean {
    assert(this._isReward != null, 'uninitialized access')
    return this._isReward
  }

  set isReward(value: boolean) {
    this._isReward = value
  }

  get era(): number | undefined | null {
    return this._era
  }

  set era(value: number | undefined | null) {
    this._era = value
  }

  get stash(): string | undefined | null {
    return this._stash
  }

  set stash(value: string | undefined | null) {
    this._stash = value
  }

  get validator(): string | undefined | null {
    return this._validator
  }

  set validator(value: string | undefined | null) {
    this._validator = value
  }

  toJSON(): object {
    return {
      eventIdx: this.eventIdx,
      amount: this.amount,
      isReward: this.isReward,
      era: this.era,
      stash: this.stash,
      validator: this.validator,
    }
  }
}
