import { Indexer } from "@ckb-lumos/indexer";
import { RPC } from "ckb-js-toolkit";

const uri = "http://127.0.0.1:8114";
const path = __dirname + "/../../indexer-data";
const indexer = new Indexer(uri, path);

export function startIndexer() {
  indexer.startForever();
}

export { indexer };

export const rpc = new RPC(uri);
