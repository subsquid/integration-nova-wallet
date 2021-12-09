const { WsProvider } = require('@polkadot/api')
export const PROVIDER = new WsProvider('wss://kusama-rpc.polkadot.io/')
export const INDEXER = 'https://kusama.indexer.gc.subsquid.io/v4/graphql'
export const API_RETRIES = 5;
export const QUERY_CACHE_SIZE = 100
export const ADDRESS_PREFIX  = 2

export const EXTRINISIC_BLACK_LIST = new Map([
        ["imOnline.heartbeat" , true],
        ["timestamp.set" , true],
        ["paraInherent.enter" , true],
        ["parachains.setHeads" , true],
        ['finalityTracker.finalHint' , true],
    ])
