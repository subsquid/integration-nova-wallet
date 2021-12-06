import {create} from './_registry'
import {AccountId32} from '@polkadot/types/interfaces'
import {u128, u32} from '@polkadot/types'
import {SubstrateEvent, SubstrateExtrinsic} from '@subsquid/hydra-common'

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

  /**
   * Pay out all the stakers behind a single validator for a single era.
   * 
   * - `validator_stash` is the stash account of the validator. Their nominators, up to
   *   `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
   * - `era` may be any era between `[current_era - history_depth; current_era]`.
   * 
   * The origin of this call must be _Signed_. Any account can call this function, even if
   * it is not one of the stakers.
   * 
   * # <weight>
   * - Time complexity: at most O(MaxNominatorRewardedPerValidator).
   * - Contains a limited number of reads and writes.
   * -----------
   * N is the Number of payouts for the validator (including the validator)
   * Weight:
   * - Reward Destination Staked: O(N)
   * - Reward Destination Controller (Creating): O(N)
   * 
   *   NOTE: weights are assuming that payouts are made to alive stash account (Staked).
   *   Paying even a dead controller is cheaper weight-wise. We don't do any refunds here.
   * # </weight>
   */
  export class Payout_stakersCall {
    private _extrinsic: SubstrateExtrinsic

    constructor(extrinsic: SubstrateExtrinsic) {
      this._extrinsic = extrinsic
    }

    get validator_stash(): AccountId32 {
      return create('AccountId32', this._extrinsic.args[0].value)
    }

    get era(): u32 {
      return create('u32', this._extrinsic.args[1].value)
    }
  }
   // Custom type for payout validator call

   export class Payout_validatorCall {
    private _extrinsic: SubstrateExtrinsic

    constructor(extrinsic: SubstrateExtrinsic) {
      this._extrinsic = extrinsic
    }
    get era(): u32 {
      return create('u32', this._extrinsic.args[0].value)
    }
  }


  export class Payout_nominatorCall {
    private _extrinsic: SubstrateExtrinsic

    constructor(extrinsic: SubstrateExtrinsic) {
      this._extrinsic = extrinsic
    }
    get era(): u32 {
      return create('u32', this._extrinsic.args[0].value)
    }
    // get validator(): 	Vec<(AccountId32, u32)> {
    //   return create('Vec<(AccountId32, u32)>', this._extrinsic.args[0].value)
    // }
  }
}
