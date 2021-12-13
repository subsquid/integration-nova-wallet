import {  SubstrateEvent,SubstrateBlock } from '@subsquid/hydra-common'
import {blockNumber, convertAddress} from "./common";
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
export async function  cachedRewardDestination(
    accountAddress: string,
    event: SubstrateEvent,
    block: SubstrateBlock
    ): Promise<RewardDestination> {
    const blockId = blockNumber(event)
    const apiAt = await apiService(block.hash)
    let key = `${blockNumber}-${event?.method}-${event?.section}`
    let cachedBlock = rewardDestinationByAddress[key]
    
    if (cachedBlock !== undefined) {
        return cachedBlock[accountAddress]
    } else {
        rewardDestinationByAddress = {}
        
        let method = event.method
        let section = event.section || event?.name.split('.')?.[0]
        const allAccountsInBlock:any = await allAccounts(block.height, method, section)

        // looks like accountAddress not related to events so just try to query payee directly
        if (allAccountsInBlock?.length === 0) {
            rewardDestinationByAddress[key] = {}
            return await apiAt.query.staking.payee(accountAddress)
        }

   // Recheck this, Work around since apiAt doesn't seem to support multi
        let queries:any = []
        for (let index = 0; index < allAccountsInBlock.length; index++) {
            queries.push([apiAt.query.staking.payee,allAccountsInBlock[index]])
        }
        const payees = (await apiAt.queryMulti(queries))
        const rewardDestinations = payees.map((payee:any) => { return payee as RewardDestination });
        
        let destinationByAddress: {[address: string]: RewardDestination} = {}
        
        // something went wrong, so just query for single accountAddress
        if (rewardDestinations?.length !== allAccountsInBlock?.length) {
            const payee = await apiAt.query.staking.payee(accountAddress)
            destinationByAddress[accountAddress] = payee
            rewardDestinationByAddress[blockId] = destinationByAddress
            return payee
        }
        allAccountsInBlock.forEach((account:string, index:number) => { 
            let address = account.toString()
            let rewardDestination = rewardDestinations[index]
            destinationByAddress[address] = rewardDestination
        })
        rewardDestinationByAddress[key] = destinationByAddress
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
    let key = `${blockNumber}-${event?.method}-${event?.section}`
    let cachedBlock = controllersByStash[key]
    const apiAt = await apiService(block.hash)
    
    if (cachedBlock !== undefined) {
        return cachedBlock[accountAddress]
    } else {
        controllersByStash = {}
        
        let method = event.method
        let section = event.section || event.name.split(".")[0]

        const allAccountsInBlock:any = await allAccounts(block.height, method, section || '')

        let controllerNeedAccounts: AccountId[] = []

        for (let accountId of allAccountsInBlock) {
            let rewardDestination = await cachedRewardDestination(accountId.toString(), event, block)
            if(!rewardDestination){
                console.log('destination not found', rewardDestination)
                const apiAt = await apiService(block.hash)
                rewardDestination =  await apiAt.query.staking.payee(accountId.toString()) as RewardDestination
            }
            if (rewardDestination.isController) {
                controllerNeedAccounts.push(accountId as AccountId)
            }
        }

        // looks like accountAddress not related to events so just try to query controller directly
        if (controllerNeedAccounts?.length === 0) {
            controllersByStash[key] = {}
            let accountId = await apiAt.query.staking.bonded(accountAddress)
            return accountId.toString()
        }
        // Recheck this, Work around since apiAt doesn't seem to support multi
        let queries:any = []
        for (let index = 0; index < controllerNeedAccounts.length; index++) {
            queries.push([apiAt.query.staking.bonded,controllerNeedAccounts[index]])
        }
        const bonded = (await apiAt.queryMulti(queries))
        const controllers = bonded.map(bonded => { return bonded.toString() });
        
        let bondedByAddress: {[address: string]: string} = {}
        
        // something went wrong, so just query for single accountAddress
        if (controllers?.length !== controllerNeedAccounts?.length) {
            const controller = await apiAt.query.staking.bonded(accountAddress)
            let controllerAddress = controller.toString()
            bondedByAddress[accountAddress] = controllerAddress
            controllersByStash[key] = bondedByAddress
            return controllerAddress
        }
        controllerNeedAccounts.forEach((account, index) => { 
            let accountAddress = account.toString()
            bondedByAddress[accountAddress] = controllers[index]
        })
        controllersByStash[key] = bondedByAddress
        return bondedByAddress[accountAddress]
    }
}