import { PROVIDER , INDEXER } from "../../constants"
import axios, {AxiosRequestConfig} from "axios"
import { ApiPromise } from "@polkadot/api"
import { convertAddressToSubstrate } from "./common"

let api: ApiPromise | undefined

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

// API tp fetch all accounts for a specific method in the indexer
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
        (payload:any) => convertAddressToSubstrate(payload?.data?.param0?.value))); 
}
