import {create} from './_registry'
import {AccountId32} from '@polkadot/types/interfaces'
import {u128} from '@polkadot/types'
import {SubstrateEvent} from '@subsquid/hydra-common'

export namespace Staking {
  /**
   * The nominator has been rewarded by this amount. \[stash, amount\]
   */
  export class RewardedEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('u128', this.event.params[1].value)]
    }
  }

  /**
   * One validator (and its nominators) has been slashed by the given amount.
   * \[validator, amount\]
   */
  export class SlashedEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('u128', this.event.params[1].value)]
    }
  }

  /**
   * A new set of stakers was elected.
   */
  export class StakersElectedEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [] {
      return []
    }
  }

  /**
   * An account has bonded this amount. \[stash, amount\]
   * 
   * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
   * it will not be emitted for staking rewards when they are added to stake.
   */
  export class BondedEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('u128', this.event.params[1].value)]
    }
  }

  /**
   * An account has unbonded this amount. \[stash, amount\]
   */
  export class UnbondedEvent {
    constructor(private event: SubstrateEvent) {}

    get params(): [AccountId32, u128] {
      return [create('AccountId32', this.event.params[0].value), create('u128', this.event.params[1].value)]
    }
  }

}
