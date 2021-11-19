import assert from "assert"
import * as marshal from "../marshal"

export class Extrinsic {
  private _hash!: string
  private _module!: string
  private _call!: string
  private _fee!: bigint
  private _success!: boolean

  constructor(props?: Partial<Omit<Extrinsic, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._hash = marshal.string.fromJSON(json.hash)
      this._module = marshal.string.fromJSON(json.module)
      this._call = marshal.string.fromJSON(json.call)
      this._fee = marshal.bigint.fromJSON(json.fee)
      this._success = marshal.boolean.fromJSON(json.success)
    }
  }

  get hash(): string {
    assert(this._hash != null, 'uninitialized access')
    return this._hash
  }

  set hash(value: string) {
    this._hash = value
  }

  get module(): string {
    assert(this._module != null, 'uninitialized access')
    return this._module
  }

  set module(value: string) {
    this._module = value
  }

  get call(): string {
    assert(this._call != null, 'uninitialized access')
    return this._call
  }

  set call(value: string) {
    this._call = value
  }

  get fee(): bigint {
    assert(this._fee != null, 'uninitialized access')
    return this._fee
  }

  set fee(value: bigint) {
    this._fee = value
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
      hash: this.hash,
      module: this.module,
      call: this.call,
      fee: marshal.bigint.toJSON(this.fee),
      success: this.success,
    }
  }
}
