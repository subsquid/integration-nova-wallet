import assert from "assert"
import * as marshal from "../marshal"
import {Extrinsic} from "./extrinsic"

export class ExtrinsicItem {
  public readonly isTypeOf = 'ExtrinsicItem'
  private _extrinsic!: Extrinsic

  constructor(props?: Partial<Omit<ExtrinsicItem, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._extrinsic = new Extrinsic(undefined, marshal.nonNull(json.extrinsic))
    }
  }

  get extrinsic(): Extrinsic {
    assert(this._extrinsic != null, 'uninitialized access')
    return this._extrinsic
  }

  set extrinsic(value: Extrinsic) {
    this._extrinsic = value
  }

  toJSON(): object {
    return {
      isTypeOf: this.isTypeOf,
      extrinsic: this.extrinsic.toJSON(),
    }
  }
}
