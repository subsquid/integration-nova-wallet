import assert from "assert"
import * as marshal from "../marshal"

export class IndividualExposure {
  private _who!: string
  private _value!: string

  constructor(props?: Partial<Omit<IndividualExposure, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._who = marshal.string.fromJSON(json.who)
      this._value = marshal.string.fromJSON(json.value)
    }
  }

  get who(): string {
    assert(this._who != null, 'uninitialized access')
    return this._who
  }

  set who(value: string) {
    this._who = value
  }

  get value(): string {
    assert(this._value != null, 'uninitialized access')
    return this._value
  }

  set value(value: string) {
    this._value = value
  }

  toJSON(): object {
    return {
      who: this.who,
      value: this.value,
    }
  }
}
