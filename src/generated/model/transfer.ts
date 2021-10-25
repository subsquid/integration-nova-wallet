import assert from "assert"
import * as marshal from "../marshal"

export class Transfer {
  private _amount!: string
  private _to!: string
  private _from!: string
  private _fee!: string
  private _eventIdx!: string
  private _success!: boolean

  constructor(props?: Partial<Omit<Transfer, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._amount = marshal.string.fromJSON(json.amount)
      this._to = marshal.string.fromJSON(json.to)
      this._from = marshal.string.fromJSON(json.from)
      this._fee = marshal.string.fromJSON(json.fee)
      this._eventIdx = marshal.string.fromJSON(json.eventIdx)
      this._success = marshal.boolean.fromJSON(json.success)
    }
  }

  get amount(): string {
    assert(this._amount != null, 'uninitialized access')
    return this._amount
  }

  set amount(value: string) {
    this._amount = value
  }

  get to(): string {
    assert(this._to != null, 'uninitialized access')
    return this._to
  }

  set to(value: string) {
    this._to = value
  }

  get from(): string {
    assert(this._from != null, 'uninitialized access')
    return this._from
  }

  set from(value: string) {
    this._from = value
  }

  get fee(): string {
    assert(this._fee != null, 'uninitialized access')
    return this._fee
  }

  set fee(value: string) {
    this._fee = value
  }

  get eventIdx(): string {
    assert(this._eventIdx != null, 'uninitialized access')
    return this._eventIdx
  }

  set eventIdx(value: string) {
    this._eventIdx = value
  }

  get success(): boolean {
    assert(this._success != null, 'uninitialized access')
    return this._success
  }

  set success(value: boolean) {
    this._success = value
  }

  toJSON(): object {
    return {
      amount: this.amount,
      to: this.to,
      from: this.from,
      fee: this.fee,
      eventIdx: this.eventIdx,
      success: this.success,
    }
  }
}
