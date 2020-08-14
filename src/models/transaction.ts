import { indexer, rpc } from "./indexer";
import {
  Script,
  Cell,
  Transaction as TransactionInterface,
} from "@ckb-lumos/base";
import {
  parseAddress,
  TransactionSkeleton,
  sealTransaction,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { common } from "@ckb-lumos/common-scripts";
import { Sign } from "./sign";
import { Record, RecordEntity } from "./record";
import Address, { AddressEntity } from "./address";
import Knex from "knex";
import { defaultConnection } from "../db/connection";

// TODO: refactor these env vars
const primaryBlake160: string =
  process.env.PRIMARY_BLAKE160! || "0x3539cd80f4d8ab4a3787bf5e7f87f32c9022ce08";
const primaryPrivateKey: string =
  process.env.PRIMARY_PRIVATE_KEY! ||
  "0x81d5eea00072b570b0d5870df9bbc12c0c38c209672ccfac97b2244889088ebd";

const primaryAddress: string = Address.generateSecpAddress(primaryBlake160);

export class Transaction {
  private static FEE: bigint = 5000n;
  private knex: Knex;

  constructor(knex: Knex = defaultConnection) {
    this.knex = knex;
  }

  // collect capacity / sudt from addresses => primary address
  // TODO: recharge record
  async summarize(
    accountId: number,
    address: string,
    privateKey: string
  ): Promise<number> {
    const lockScript: Script = parseAddress(address);
    const collector = indexer.collector({
      lock: lockScript,
    });

    const cells: Cell[] = [];
    for await (const inputCell of collector.collect()) {
      cells.push(inputCell);
    }

    if (cells.length === 0) {
      return -1;
    }

    const totalCapacity: bigint = cells
      .map((cell) => BigInt(cell.cell_output.capacity))
      .reduce((result, c) => result + c, 0n);

    let txSkeleton = TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = await common.transfer(
      txSkeleton,
      [address],
      primaryAddress,
      totalCapacity
    );

    txSkeleton = await common.payFee(
      txSkeleton,
      [primaryAddress],
      Transaction.FEE
    );

    const tx = this.getTx(txSkeleton, privateKey);

    const txHash: string = await rpc.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: totalCapacity.toString(),
      sudt_amount: "0",
      type: "summarize",
      to_address: primaryAddress,
      from_addresses: [address],
      transaction_hash: txHash,
      account_id: accountId,
    };

    const recordId: number = await new Record().save(recordEntity);

    return recordId;
  }

  // TODO: using indexer#subscribe to listen transaction committed
  async summarizeAll() {
    const addressEntities: AddressEntity[] = await this.knex
      .select()
      .from("addresses");

    for (const addressEntity of addressEntities) {
      const secpAddress: string = Address.generateSecpAddress(
        addressEntity.blake160
      );

      await this.summarize(
        addressEntity.account_id!,
        secpAddress,
        addressEntity.private_key
      );
    }
  }

  async scheduleSummarizeAll() {
    return setInterval(async () => {
      return this.summarizeAll();
    }, 5 * 1000);
  }

  async withdraw(
    accountId: number,
    toAddress: string,
    capacity: bigint
  ): Promise<number> {
    let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
      cellProvider: indexer,
    });
    txSkeleton = await common.transfer(
      txSkeleton,
      [primaryAddress],
      toAddress,
      capacity
    );

    txSkeleton = await common.payFee(
      txSkeleton,
      [primaryAddress],
      Transaction.FEE
    );

    const tx = this.getTx(txSkeleton, primaryPrivateKey);
    const txHash: string = await rpc.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: capacity.toString(),
      sudt_amount: "0",
      type: "withdraw",
      to_address: toAddress,
      from_addresses: [primaryAddress],
      transaction_hash: txHash,
      account_id: accountId,
    };

    const recordId: number = await new Record().save(recordEntity);

    return recordId;
  }

  private getTx(
    txSkeleton: TransactionSkeletonType,
    privateKey: string
  ): TransactionInterface {
    txSkeleton = common.prepareSigningEntries(txSkeleton);

    const sign = new Sign(privateKey);
    const contents: string[] = txSkeleton
      .get("signingEntries")
      .map((s) => {
        return sign.signRecoverable(s.message);
      })
      .toJS();

    const tx: TransactionInterface = sealTransaction(txSkeleton, contents);

    return tx;
  }
}
