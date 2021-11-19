// const polk= require("@polkadot/api")
// async function m(){
//  const api = await polk.ApiPromise.create({ provider: new polk.WsProvider('wss://kusama-rpc.polkadot.io/') })
//  let res = await api.at("0x5dabc4070ad76ed7fecf05269c0f787c8a9d4a8adccad8443a73ab697c29b861").query.crowdloan.funds(2007);
// //  let res = await api.query.crowdloan.funds.at("0x5dabc4070ad76ed7fecf05269c0f787c8a9d4a8adccad8443a73ab697c29b861",2007);
// //  let res = await api.query.crowdloan.funds(2007);
//  console.log(res.toJSON())
// }
// m()


const axios = require("axios")
const {AxiosRequestConfig} = require("axios")
const axiosRetry = require('axios-retry');
const { ApiPromise, WsProvider } = require("@polkadot/api")
let api

axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay});

const PROVIDER = new WsProvider('wss://kusama-rpc.polkadot.io/');

const apiService =  async () => {
    if (api) return api;
    api = await ApiPromise.create({ provider: PROVIDER })
    return api
}


apiService()