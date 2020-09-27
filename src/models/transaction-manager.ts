import TransactionManager from "@ckb-lumos/transaction-manager";
import { indexer } from "./indexer";

const transactionManager = new TransactionManager(indexer);

export function startTransactionManager() {
  transactionManager.start();
}

export { transactionManager };
