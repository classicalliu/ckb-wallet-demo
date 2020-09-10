import { indexer, rpc } from "./indexer";
import {
  Script,
  Cell,
  Transaction as TransactionInterface,
  Header,
} from "@ckb-lumos/base";
import {
  parseAddress,
  TransactionSkeleton,
  sealTransaction,
  TransactionSkeletonType,
  generateAddress,
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
    addresses: string[],
    privateKey: string,
    tipHeader: Header
  ): Promise<number> {
    const lockScripts: Script[] = addresses.map((address) => {
      return parseAddress(address);
    });
    const collectors = lockScripts.map((lockScript) => {
      return indexer.collector({
        lock: lockScript,
      });
    });

    const cells: Cell[] = [];
    for (const collector of collectors) {
      for await (const inputCell of collector.collect()) {
        cells.push(inputCell);
      }
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
      addresses,
      primaryAddress,
      totalCapacity,
      undefined,
      tipHeader
    );

    txSkeleton = await common.payFee(
      txSkeleton,
      [primaryAddress],
      Transaction.FEE,
      tipHeader
    );

    // fromAddresses is addresses really used in transaction inputs
    const fromAddresses: string[] = txSkeleton
      .get("inputs")
      .map((input) => {
        return generateAddress(input.cell_output.lock);
      })
      .toJS();

    const tx = this.getTx(txSkeleton, privateKey);

    const txHash: string = await rpc.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: totalCapacity.toString(),
      sudt_amount: "0",
      type: "summarize",
      to_address: primaryAddress,
      from_addresses: fromAddresses,
      transaction_hash: txHash,
      account_id: accountId,
    };

    const recordId: number = await new Record().save(recordEntity);

    return recordId;
  }

  async summarizeAll() {
    const addressEntities: AddressEntity[] = await this.knex
      .select()
      .from("addresses");
    const tipHeader = await this.getTipBlockHeader();

    for (const addressEntity of addressEntities) {
      const addresses: string[] = Address.generateAllAddresses(
        addressEntity.blake160
      );

      await this.summarize(
        addressEntity.account_id!,
        addresses,
        addressEntity.private_key,
        tipHeader
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

    const tipHeader: Header = await this.getTipBlockHeader();

    txSkeleton = await common.transfer(
      txSkeleton,
      [primaryAddress],
      toAddress,
      capacity,
      undefined,
      tipHeader
    );

    txSkeleton = await common.payFee(
      txSkeleton,
      [primaryAddress],
      Transaction.FEE,
      tipHeader
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

  private async getTipBlockHeader(): Promise<Header> {
    const header: Header = await rpc.get_tip_header();
    return header;
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
