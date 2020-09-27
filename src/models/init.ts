import { Transaction } from "./transaction";
import { startIndexer, indexer } from "./indexer";
import { startTransactionManager } from "./transaction-manager";

export async function init() {
  // start indexer
  startIndexer();
  startTransactionManager();
  setInterval(async () => {
    const tip = await indexer.tip();
    console.log("tip block number:", +tip.block_number);
  }, 1000);
  // schedule transaction records
  const transaction = new Transaction();
  transaction.scheduleSummarizeAll();
}
