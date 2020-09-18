import { indexer, rpc } from "./indexer";
import {
  Script,
  Cell,
  Transaction as TransactionInterface,
  Header,
  HexString,
  utils,
} from "@ckb-lumos/base";
import {
  parseAddress,
  TransactionSkeleton,
  sealTransaction,
  TransactionSkeletonType,
  generateAddress,
} from "@ckb-lumos/helpers";
import { common, sudt } from "@ckb-lumos/common-scripts";
import { Sign } from "./sign";
import { Record, RecordEntity } from "./record";
import Address, { AddressEntity } from "./address";
import Knex from "knex";
import { defaultConnection } from "../db/connection";
import { getConfig } from "@ckb-lumos/config-manager";
const { readBigUInt128LE } = utils;
import { Parser } from "json2csv";

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
  async summarizeCkb(
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
        type: "empty",
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

  async summarizeSudt(
    accountId: number,
    addresses: string[],
    privateKey: string,
    tipHeader: Header
  ): Promise<number> {
    const sudtTemplate = getConfig().SCRIPTS.SUDT!;
    const lockScripts: Script[] = addresses.map((address) => {
      return parseAddress(address);
    });
    const collectors = lockScripts.map((lockScript) => {
      return indexer.collector({
        lock: lockScript,
        type: {
          code_hash: sudtTemplate.CODE_HASH,
          hash_type: sudtTemplate.HASH_TYPE,
          args: "0x",
        },
        argsLen: 32,
      });
    });

    const map = new Map<string, Cell[]>();

    for (const collector of collectors) {
      for await (const inputCell of collector.collect()) {
        const typeArgs = inputCell.cell_output.type!.args;
        let value: Cell[] = map.get(typeArgs) || [];
        value.push(inputCell);
        map.set(typeArgs, value);
      }
    }

    if ([...map.values()].flat().length === 0) {
      return -1;
    }

    let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

    let totalCapacity: bigint = 0n;
    let totalAmount: bigint = 0n;
    for (const [typeArgs, inputCells] of map) {
      const capacity: bigint = inputCells
        .map((cell) => BigInt(cell.cell_output.capacity))
        .reduce((result, c) => result + c, 0n);

      const amount: bigint = inputCells
        .map((cell) => readBigUInt128LE(cell.data))
        .reduce((result, c) => result + c, 0n);

      totalCapacity += capacity;
      totalAmount += amount;

      txSkeleton = await sudt.transfer(
        txSkeleton,
        addresses,
        typeArgs,
        primaryAddress,
        amount,
        undefined,
        capacity,
        tipHeader
      );
    }

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
      sudt_amount: totalAmount.toString(),
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

      await this.summarizeCkb(
        addressEntity.account_id!,
        addresses,
        addressEntity.private_key,
        tipHeader
      );

      await this.summarizeSudt(
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
    capacity?: bigint,
    {
      sudtAmount = undefined,
      sudtToken = undefined,
    }: {
      sudtAmount?: bigint;
      sudtToken?: HexString;
    } = {}
  ): Promise<number> {
    if (!capacity && (!sudtAmount || !sudtToken)) {
      throw new Error(`Error with capacity & sudt token / amount!`);
    }

    let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
      cellProvider: indexer,
    });

    const tipHeader: Header = await this.getTipBlockHeader();

    const fromInfos = [primaryAddress];

    let sudtMode: boolean = false;
    if (sudtToken && sudtAmount) {
      sudtMode = true;
      txSkeleton = await sudt.transfer(
        txSkeleton,
        fromInfos,
        sudtToken,
        toAddress,
        sudtAmount,
        undefined,
        capacity,
        tipHeader
      );
    } else if (!!capacity) {
      txSkeleton = await common.transfer(
        txSkeleton,
        fromInfos,
        toAddress,
        capacity,
        undefined,
        tipHeader
      );
    } else {
      throw new Error(`Error with capacity & sudtAmount!`);
    }

    txSkeleton = await common.payFee(
      txSkeleton,
      fromInfos,
      Transaction.FEE,
      tipHeader
    );

    const realCapacity: bigint = txSkeleton
      .get("outputs")
      .filter((output) => {
        const addr = generateAddress(output.cell_output.lock);
        return addr === toAddress;
      })
      .map((output) => BigInt(output.cell_output.capacity))
      .reduce((result, c) => result + c, 0n);

    const tx = this.getTx(txSkeleton, primaryPrivateKey);
    const txHash: string = await rpc.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: realCapacity.toString(),
      sudt_amount: sudtMode ? sudtAmount!.toString() : "0",
      type: "withdraw",
      to_address: toAddress,
      from_addresses: [primaryAddress],
      transaction_hash: txHash,
      account_id: accountId,
    };

    const recordId: number = await new Record().save(recordEntity);

    return recordId;
  }

  async getTransactions(accountId: number) {
    const record = new Record();

    const records = await record.getByAccountId(accountId);

    return records.map((record) => {
      return {
        transaction_hash: record.transaction_hash,
        capacity:
          record.type === "withdraw"
            ? record.capacity
            : (-BigInt(record.capacity)).toString(),
        sudt_amount:
          record.type === "withdraw"
            ? record.sudt_amount
            : (-BigInt(record.sudt_amount)).toString(),
      };
    });
  }

  async downloadCsv(accountId: number): Promise<string> {
    const records = await this.getTransactions(accountId);

    const fields: string[] = ["transaction_hash", "capacity", "sudt_amount"];

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(records);
    return csv;
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
