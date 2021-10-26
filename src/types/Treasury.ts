import {create} from './_registry'
import {u128} from '@polkadot/types'
import {SubstrateEvent} from '@subsquid/hydra-common'

export namespace Treasury {
  /**
   * Some funds have been deposited. \[deposit\]
   */
  export class DepositEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [u128] {
      return [create('u128', this.event.params[0].value)]
    }
  }

}
