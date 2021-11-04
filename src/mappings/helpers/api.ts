import { PROVIDER , INDEXER, API_RETRIES } from "../../constants"
import axios, {AxiosRequestConfig} from "axios"
import axiosRetry from 'axios-retry';
import { ApiPromise } from "@polkadot/api"
import { convertAddressToSubstrate } from "./common"

axiosRetry(axios, { retries: API_RETRIES, retryDelay: axiosRetry.exponentialDelay});
let api: ApiPromise | undefined

export interface allBlockEvents {
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
}

export interface allBlockExrinisics {
  section : string;
  method: string;
  id: string;
  signer: string;
  args :any;
 
}

export const apiService =  async () => {
    if (api) return api;
    api = await ApiPromise.create({ provider: PROVIDER })
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

return await axiosPOSTRequest(data).then(
    (result:any) => result?.data?.substrate_event?.map ( 
        (payload:any) => { 
         let address = payload?.data?.param0?.value
         if (typeof address === 'string')
         return  convertAddressToSubstrate(payload?.data?.param0?.value) 
        }).filter((entry:any) => entry)
        )
}

/**
 * API to fetch all block events
 * @param {number} blockNumber 
 * @returns {Array<allBlockEvents>}
 */
export const allBlockEvents = async (
    blockNumber : number
) => {
  // please be cautions when modifying query, extra spaces line endings could cause query not to work
const query =`query MyQuery {
  substrate_event (where:{blockNumber:{_eq:${blockNumber}}}){
    section
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

return await axiosPOSTRequest(data).then(
    (result:any) => {
      const response: Array<allBlockEvents> = result?.data?.substrate_event;
      return response
    }); 
}

/**
 *  API to fetch all block extrinsics with blocknumber
 * @param {number} blockNumber 
 */
export const allBlockExtrinsics = async (
    blockNumber : number
): Promise<Array<allBlockExrinisics> | []> => {
  // please be cautions when modifying query, extra spaces line endings could cause query not to work
const query =`query MyQuery {
  substrate_extrinsic (where:{blockNumber:{_eq:${blockNumber}}}){
    section
    signer
    method
    id
    args
  }
}
`
let data = JSON.stringify({
  query,
  variables: {}
});

return await axiosPOSTRequest(data).then(
    (result:any) => result?.data?.substrate_extrinsic)
}
