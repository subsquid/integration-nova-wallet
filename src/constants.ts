const { WsProvider } = require('@polkadot/api')
export const PROVIDER = new WsProvider('wss://kusama-rpc.polkadot.io/')
export const INDEXER = 'https://kusama.indexer.gc.subsquid.io/v4/graphql'
export const API_RETRIES = 5;
