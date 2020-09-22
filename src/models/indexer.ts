import { Indexer } from "@ckb-lumos/indexer";
import { RPC } from "ckb-js-toolkit";

const uri = process.env.CHAIN_RPC_URI!;
const path = __dirname + "/../../indexer-data";
const indexer = new Indexer(uri, path);

export function startIndexer() {
  indexer.startForever();
}

export { indexer };

export const rpc = new RPC(uri);
