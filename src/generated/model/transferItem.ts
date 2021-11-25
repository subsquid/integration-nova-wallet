import assert from "assert"
import * as marshal from "../marshal"
import {Transfer} from "./transfer.model"

export class TransferItem {
  public readonly isTypeOf = 'TransferItem'
  private _transfer!: string

  constructor(props?: Partial<Omit<TransferItem, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._transfer = marshal.string.fromJSON(json.transfer)
    }
  }

  get transfer(): string {
    assert(this._transfer != null, 'uninitialized access')
    return this._transfer
  }

  set transfer(value: string) {
    this._transfer = value
  }

  toJSON(): object {
    return {
      isTypeOf: this.isTypeOf,
      transfer: this.transfer,
    }
  }
}
