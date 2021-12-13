
import { DatabaseManager } from '@subsquid/hydra-common'
export async function getOrCreate<T extends {id: string}>(
    store: DatabaseManager,
    entityConstructor: EntityConstructor<T>,
    id: string
  ): Promise<T> {
  
    let e = await store.get(entityConstructor, {
      where: { id },
    })
  
    if (e == null) {
      e = new entityConstructor()
      e.id = id
    }
  
    return e
  }


  export async function get<T extends {id: string}>(
    store: DatabaseManager,
    entityConstructor: EntityConstructor<T>,
    id: string
  ): Promise<T | undefined> {
  
    let e = await store.get(entityConstructor, {
      where: { id },
    })
  
    return e
  }
  
  
  type EntityConstructor<T> = {
    new (...args: any[]): T
  }

  // balances and treasury map fees map for extriniscs
  export interface mapExtrinisicToFees {[extrinisicId: string]:{
    balances?: bigint,
    treasury?: bigint,
    Withdraw?: bigint
  }}