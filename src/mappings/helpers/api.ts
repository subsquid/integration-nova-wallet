import { PROVIDER , INDEXER, API_RETRIES } from "../../constants"
import axios, {AxiosRequestConfig} from "axios"
import axiosRetry from 'axios-retry';
import { ApiPromise } from "@polkadot/api"
import {  convertAddressToSubstrate } from "./common"

axiosRetry(axios, { retries: API_RETRIES, retryDelay: axiosRetry.exponentialDelay});
let api: ApiPromise | undefined

let blockEventCache: {[blockNumber:number]: Array<BlockEvent>} = {}
let blockExtrinsicsCache: {[blockNumber:number]: Array<BlockExtrinisic>} = {}
let accountsCache: any = {}

export interface BlockEvent {
  section : string;
  method: string;
  id: string;
  data:  any;
  blockHash: string;
  params: any;
  name : string;
  indexInBlock : any;
  blockNumber : any;
  blockTimestamp: any;
  extrinsicId?: string
}

export interface BlockExtrinisic {
  section : string;
  method: string;
  id: string;
  signer: string;
  args :any;
  indexInBlock: number;
  tip: bigint;
  signature:string;
  hash: string;
  name: string;
  substrate_events :[{
    name: string;
    id: string
  }];
 
}

export const apiService =  async () => {
    if (api) return api;
    api = await ApiPromise.create({ provider: PROVIDER })
    // await api.isReady
    return api
}

export const axiosPOSTRequest = async (
    data : any,
    indexer = INDEXER
    ) => {
    const config: AxiosRequestConfig = {
        method: 'post',
        url: indexer,
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
     return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
}

/**
 * API to fetch all accounts for a specific method in the indexer
 * @param {number} blockNumber 
 * @param {string} method 
 * @param {string} section 
 */
export const allAccounts = async (
    blockNumber : number,
    method: string,
    section : string
) => {
  if(accountsCache[`${blockNumber}-${method}-${section}`]){
    return accountsCache[`${blockNumber}-${method}-${section}`]
  }
  // clear cache
  accountsCache = {}
  // please be cautions when modifying query, extra spaces line endings could cause query not to work
const query =`query MyQuery {
  substrate_event(where: {blockNumber: {_eq: ${blockNumber}}, method: {_eq: ${method}}, section: {_eq: ${section}}}) {
    id
    method
    section
    data
  }
}`
let data = JSON.stringify({
  query,
  variables: {}
});

accountsCache[`${blockNumber}-${method}-${section}`] = await axiosPOSTRequest(data).then(
    (result:any) => result?.data?.substrate_event?.map ( 
        (payload:any) => { 
         let address = payload?.data?.param0?.value
         if (typeof address === 'string')
         return  convertAddressToSubstrate(payload?.data?.param0?.value) 
        }).filter((entry:any) => entry)
        )

return accountsCache[`${blockNumber}-${method}-${section}`]
}

/**
 * API to fetch all block events
 * @param {number} blockNumber 
 * @returns {Array<BlockEvent>}
 */
export const BlockEvent = async (
    blockNumber : number
) => {
  if(blockEventCache[blockNumber]){
    return blockEventCache[blockNumber]
  }
  // Clear cache
  blockEventCache = {}
  // please be cautions when modifying query, extra spaces line endings could cause query not to work
const query =`query MyQuery {
  substrate_event (where:{blockNumber:{_eq:${blockNumber}}}){
    section
    extrinsicId
    method
    id
    data
    blockHash
    params
    name
    indexInBlock
    blockNumber
    blockTimestamp
  }
}`
let data = JSON.stringify({
  query,
  variables: {}
});

blockEventCache[blockNumber] = await axiosPOSTRequest(data).then(
    (result:any) => {
      const response: Array<BlockEvent> = result?.data?.substrate_event;
      return response
    }); 
return blockEventCache[blockNumber]
}

/**
 *  API to fetch all block extrinsics with blocknumber
 * @param {number} blockNumber 
 */
export const allBlockExtrinsics = async (
    blockNumber : number
): Promise<Array<BlockExtrinisic> | []> => {

  if(blockExtrinsicsCache[blockNumber]){
    return blockExtrinsicsCache[blockNumber]
  }
  // Clear cache
  blockExtrinsicsCache = {}
  // please be cautions when modifying query, extra spaces line endings could cause query not to work
const query =`query MyQuery {
  substrate_extrinsic(where:{blockNumber:{_eq:${blockNumber}}}){
    section
    signer
    method
    id
    name
    args
    hash
    indexInBlock
    tip
    signature
    hash
    substrate_events {
      name
      id
    }
  }
}
`
let data = JSON.stringify({
  query,
  variables: {}
});

blockExtrinsicsCache[blockNumber] = await axiosPOSTRequest(data).then(
    (result:any) => result?.data?.substrate_extrinsic)

return blockExtrinsicsCache[blockNumber]
}