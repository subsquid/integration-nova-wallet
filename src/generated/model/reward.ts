import assert from "assert"
import * as marshal from "../marshal"

export class Reward {
  private _eventIdx!: string
  private _amount!: bigint
  private _era!: number | undefined | null
  private _stash!: string | undefined | null
  private _validator!: string | undefined | null

  constructor(props?: Partial<Omit<Reward, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._eventIdx = marshal.string.fromJSON(json.eventIdx)
      this._amount = marshal.bigint.fromJSON(json.amount)
      this._era = json.era == null ? undefined : marshal.int.fromJSON(json.era)
      this._stash = json.stash == null ? undefined : marshal.string.fromJSON(json.stash)
      this._validator = json.validator == null ? undefined : marshal.string.fromJSON(json.validator)
    }
  }

  get eventIdx(): string {
    assert(this._eventIdx != null, 'uninitialized access')
    return this._eventIdx
  }

  set eventIdx(value: string) {
    this._eventIdx = value
  }

  get amount(): bigint {
    assert(this._amount != null, 'uninitialized access')
    return this._amount
  }

  set amount(value: bigint) {
    this._amount = value
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
      amount: marshal.bigint.toJSON(this.amount),
      era: this.era,
      stash: this.stash,
      validator: this.validator,
    }
  }
}
