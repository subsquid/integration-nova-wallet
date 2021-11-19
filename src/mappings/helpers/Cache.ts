import {  SubstrateEvent,SubstrateBlock } from '@subsquid/hydra-common'
import {blockNumber} from "./common";
import {AccountId} from "@polkadot/types/interfaces";
import {RewardDestination} from "@polkadot/types/interfaces/staking";
import { apiService , allAccounts} from '../helpers/api';

//  Due to memory consumption optimization `rewardDestinationByAddress` contains only one key
let rewardDestinationByAddress: {[blockId: string]: {[address: string]: RewardDestination}} = {}
let controllersByStash: {[blockId: string]: {[address: string]: string}} = {}

/**
 * Caches reward destination for addresses in the block
 * While creating the bond, one can specify the controller and
 * stash. The stash address where the rewards are paid out can be
 * obtained from payee storage function
 * @param accountAddress 
 * @param event 
 * @param block
 */
export async function cachedRewardDestination(
    accountAddress: string,
    event: SubstrateEvent,
    block: SubstrateBlock
    ): Promise<RewardDestination> {
    const blockId = blockNumber(event)
    const api = await apiService()
    let cachedBlock = rewardDestinationByAddress[blockId]
    
    if (cachedBlock !== undefined) {
        return cachedBlock[accountAddress]
    } else {
        rewardDestinationByAddress = {}
        
        let method = event.method
        let section = event.section || event?.name.split('.')?.[0]
        const allAccountsInBlock:any = await allAccounts(block.height, method, section)

        // looks like accountAddress not related to events so just try to query payee directly
        if (allAccountsInBlock?.length === 0) {
            rewardDestinationByAddress[blockId] = {}
            return await api.query.staking.payee.at(block.hash,accountAddress)
        }

        // Recheck this, may need to call from a specific block with at
        const payees = await api.query.staking.payee.multi(allAccountsInBlock);
        const rewardDestinations = payees.map((payee:any) => { return payee as RewardDestination });
        
        let destinationByAddress: {[address: string]: RewardDestination} = {}
        
        // something went wrong, so just query for single accountAddress
        if (rewardDestinations?.length !== allAccountsInBlock?.length) {
            const payee = await api.query.staking.payee.at(block.hash,accountAddress)
            destinationByAddress[accountAddress] = payee
            rewardDestinationByAddress[blockId] = destinationByAddress
            return payee
        }
        allAccountsInBlock.forEach((account:string, index:number) => { 
            let accountAddress = account.toString()
            let rewardDestination = rewardDestinations[index]
            destinationByAddress[accountAddress] = rewardDestination
        })
        rewardDestinationByAddress[blockId] = destinationByAddress
        return destinationByAddress[accountAddress]
    }
}

/**
 * Cache controller addresses for stash address 
 * @param accountAddress 
 * @param event 
 * @param block
 */
export async function cachedController(
    accountAddress: string,
    event: SubstrateEvent,
    block :SubstrateBlock
    ): Promise<string> {
    const blockId = blockNumber(event)
    let cachedBlock = controllersByStash[blockId]
    const api = await apiService()
    
    if (cachedBlock !== undefined) {
        return cachedBlock[accountAddress]
    } else {
        controllersByStash = {}
        
        let method = event.method
        let section = event.section || event.name.split(".")[0]

        const allAccountsInBlock:any = await allAccounts(block.height, method, section || '')

        let controllerNeedAccounts: AccountId[] = []

        for (let accountId of allAccountsInBlock) {
            const rewardDestination = await cachedRewardDestination(accountId.toString(), event, block)

            if (rewardDestination.isController) {
                controllerNeedAccounts.push(accountId as AccountId)
            }
        }

        // looks like accountAddress not related to events so just try to query controller directly
        if (controllerNeedAccounts?.length === 0) {
            controllersByStash[blockId] = {}
            let accountId = await api.query.staking.bonded.at(block.hash,accountAddress)
            return accountId.toString()
        }
        // Recheck this, may need to call from a specific block with at
        const bonded = await api.query.staking.bonded.multi(controllerNeedAccounts);
        const controllers = bonded.map(bonded => { return bonded.toString() });
        
        let bondedByAddress: {[address: string]: string} = {}
        
        // something went wrong, so just query for single accountAddress
        if (controllers?.length !== controllerNeedAccounts?.length) {
            const controller = await api.query.staking.bonded.at(block.hash,accountAddress)
            let controllerAddress = controller.toString()
            bondedByAddress[accountAddress] = controllerAddress
            controllersByStash[blockId] = bondedByAddress
            return controllerAddress
        }
        controllerNeedAccounts.forEach((account, index) => { 
            let accountAddress = account.toString()
            bondedByAddress[accountAddress] = controllers[index]
        })
        controllersByStash[blockId] = bondedByAddress
        return bondedByAddress[accountAddress]
    }
}