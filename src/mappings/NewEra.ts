import {EventContext, StoreContext} from '@subsquid/hydra-common'
import {eventId} from "./helpers/common";
import { getOrCreate } from './helpers/helpers';
import { EraValidatorInfo } from '../generated/model';
import { apiService } from './helpers/api';

export async function handleStakersElected({
    store,
    event,
    block,
    extrinsic,
  }: EventContext & StoreContext): Promise<void> {
    await handleNewEra({store,
        event,
        block,
        extrinsic})
}

export async function handleNewEra( {
    store,
    event,
    block,
    extrinsic,
  }: EventContext & StoreContext): Promise<void> {
    const api = await apiService()
    const currentEra = (await api.query.staking.currentEra()).unwrap()

    const exposures = await api.query.staking.erasStakersClipped.entries(currentEra.toNumber());

    const eraValidatorInfos = exposures.map(async ([key, exposure]:any) => {
        const [, validatorId] = key.args

        let validatorIdString = validatorId.toString()
        const eraValidatorInfo = await getOrCreate(store, EraValidatorInfo,eventId(event)+validatorIdString)
        eraValidatorInfo.era = currentEra.toNumber()
        eraValidatorInfo.address = validatorIdString
        eraValidatorInfo.total = exposure.total.toBigInt()
        eraValidatorInfo.own = exposure.own.toBigInt()
        eraValidatorInfo.others = exposure.others.map((other:any) => {
            return {
                who: other.who.toString(),
                value: other.value.toString()
            }
        })
        return await store.save(eraValidatorInfo)
    })

    await Promise.allSettled(eraValidatorInfos)
}
