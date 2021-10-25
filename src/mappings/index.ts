// export * from './balances';
import {
    EventContext,
    StoreContext,
  } from "@subsquid/hydra-common";
export * from './NewEra';
export * from './Transfers';
export * from './StakeChanged';




// export async function test({
//     store,
//     event,
//     block,
//     extrinsic,
//   }: EventContext & StoreContext): Promise<void> {
//     console.log('here at block ='+ block.height)
// }