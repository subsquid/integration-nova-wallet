
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
  
  
  type EntityConstructor<T> = {
    new (...args: any[]): T
  }