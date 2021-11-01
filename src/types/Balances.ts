import {create} from './_registry'
import {AccountId32, MultiAddress} from '@polkadot/types/interfaces'
import {Compact, u128} from '@polkadot/types'
import {SubstrateEvent, SubstrateExtrinsic} from '@subsquid/hydra-common'

export namespace Balances {
  /**
   * Transfer succeeded. \[from, to, value\]
   */
  export class TransferEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('AccountId32', this.event.params[1].value), create('u128', this.event.params[2].value)]
    }
  }

  /**
   * Some amount was deposited into the account (e.g. for transaction fees). \[who,
   * deposit\]
   */
  export class DepositEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('u128', this.event.params[1].value)]
    }
  }

  /**
   * Same as the [`transfer`] call, but with a check that the transfer will not kill the
   * origin account.
   * 
   * 99% of the time you want [`transfer`] instead.
   * 
   * [`transfer`]: struct.Pallet.html#method.transfer
   * # <weight>
   * - Cheaper than transfer because account cannot be killed.
   * - Base Weight: 51.4 µs
   * - DB Weight: 1 Read and 1 Write to dest (sender is in overlay already)
   * #</weight>
   */
  export class Transfer_keep_aliveCall {
    private _extrinsic: SubstrateExtrinsic

    constructor(extrinsic: SubstrateExtrinsic) {
      this._extrinsic = extrinsic
    }

    get dest(): MultiAddress {
      return create('MultiAddress', this._extrinsic.args[0].value)
    }

    get value(): Compact<u128> {
      return create('Compact<u128>', this._extrinsic.args[1].value)
    }
  }
}
