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
import { transactionManager } from "./transaction-manager";

// TODO: refactor these env vars
const primaryBlake160: string = process.env.PRIMARY_BLAKE160!;
const primaryPrivateKey: string = process.env.PRIMARY_PRIVATE_KEY!;

const primaryAddress: string = Address.generateSecpAddress(primaryBlake160);

export class Transaction {
  private static FEE: bigint = 5000n;
  private knex: Knex;

  constructor(knex: Knex = defaultConnection) {
    this.knex = knex;
  }

  // collect capacity / sudt from addresses => primary address
  async summarizeCkb(
    accountId: number,
    fromAddress: string,
    privateKey: string,
    tipHeader: Header
  ): Promise<number> {
    const lockScript: Script = parseAddress(fromAddress);
    const collector = indexer.collector({
      lock: lockScript,
      type: "empty",
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
      [fromAddress],
      primaryAddress,
      totalCapacity,
      undefined,
      tipHeader
    );

    // change `cellProvider` to transactionManager to using pending cells, and more important, to filter cells which in transaction's inputs
    // fee are all paid by primaryAddress, so using transactionManager to filter spent cells (still in pending transactions).
    // same in sumarizeSudt
    txSkeleton = txSkeleton.set("cellProvider", transactionManager);
    txSkeleton = await common.payFee(
      txSkeleton,
      [primaryAddress],
      Transaction.FEE,
      tipHeader
    );

    const tx = this.getTx(txSkeleton, privateKey);

    const txHash: string = await transactionManager.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: totalCapacity.toString(),
      sudt_amount: "0",
      type: "summarize",
      to_address: primaryAddress,
      from_addresses: [fromAddress],
      transaction_hash: txHash,
      account_id: accountId,
    };

    // record recharge info
    const fromTxHashes = new Set(cells.map((cell) => cell.out_point!.tx_hash));
    const rechargeEntities: RecordEntity[] = [];
    for (const hash of fromTxHashes) {
      const fromTxWithStatus = await rpc.get_transaction(hash);
      const fromTx: TransactionInterface = fromTxWithStatus.transaction;
      const targetOutput = fromTx.outputs.find((output) => {
        return generateAddress(output.lock) === fromAddress;
      });
      const inputAddresses: string[] = [];
      for (const input of fromTx.inputs) {
        const previousOutput = input.previous_output;
        const fromOutputTxWithStatus = await rpc.get_transaction(
          previousOutput.tx_hash
        );
        const fromOutputTx: TransactionInterface =
          fromOutputTxWithStatus.transaction;
        const o = fromOutputTx.outputs[+previousOutput.index];
        const lock = o.lock;
        inputAddresses.push(generateAddress(lock));
      }

      if (targetOutput) {
        const entity: RecordEntity = {
          capacity: BigInt(targetOutput.capacity).toString(),
          sudt_amount: "0",
          type: "recharge",
          to_address: fromAddress,
          from_addresses: inputAddresses,
          transaction_hash: hash,
        };
        rechargeEntities.push(entity);
      }
    }

    const recordIds = await new Record().saveAll([
      recordEntity,
      ...rechargeEntities,
    ]);

    return recordIds[0];
  }

  private isSudtCell(cell: Cell): boolean {
    const template = getConfig().SCRIPTS.SUDT!;

    const type = cell.cell_output.type;
    if (!type) {
      return false;
    }
    return (
      type.code_hash === template.CODE_HASH &&
      type.hash_type === template.HASH_TYPE
    );
  }

  /**
   * Every sudt type has one transaction.
   *
   * @param accountId
   * @param address
   * @param privateKey
   * @param tipHeader
   */
  async summarizeSudt(
    accountId: number,
    address: string,
    privateKey: string,
    tipHeader: Header
  ): Promise<number[]> {
    const lockScript: Script = parseAddress(address);
    const collector = indexer.collector({
      lock: lockScript,
      // TODO: Waiting for support type.argsLen = "any" to filter all sUDT cells
    });

    // key: type args / sudt token
    const map = new Map<string, Cell[]>();

    for await (const inputCell of collector.collect()) {
      if (!this.isSudtCell(inputCell)) {
        continue;
      }
      const typeArgs = inputCell.cell_output.type!.args;
      let value: Cell[] = map.get(typeArgs) || [];
      value.push(inputCell);
      map.set(typeArgs, value);
    }

    if ([...map.values()].flat().length === 0) {
      return [];
    }

    let allRecordIds: number[] = [];
    for (const [sudtToken, cells] of map) {
      let summarizeRecords: RecordEntity[] = [];
      let rechargeRecords: RecordEntity[] = [];
      let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

      const totalCapacity: bigint = cells
        .map((cell) => BigInt(cell.cell_output.capacity))
        .reduce((result, c) => result + c, 0n);
      const totalAmount: bigint = cells
        .map((cell) => readBigUInt128LE(cell.data))
        .reduce((result, c) => result + c, 0n);

      txSkeleton = await sudt.transfer(
        txSkeleton,
        [address],
        sudtToken,
        primaryAddress,
        totalAmount,
        undefined,
        totalCapacity,
        tipHeader
      );

      txSkeleton = txSkeleton.set("cellProvider", transactionManager);
      txSkeleton = await common.payFee(
        txSkeleton,
        [primaryAddress],
        Transaction.FEE,
        tipHeader
      );

      const record: RecordEntity = {
        capacity: totalCapacity.toString(),
        sudt_amount: totalAmount.toString(),
        sudt_token: sudtToken,
        type: "summarize",
        to_address: primaryAddress,
        from_addresses: [address],
        transaction_hash: "",
        account_id: accountId,
      };
      summarizeRecords.push(record);

      const fromTxHashes = new Set(
        cells.map((cell) => cell.out_point!.tx_hash!)
      );
      for (const hash of fromTxHashes) {
        const fromTxWithStatus = await rpc.get_transaction(hash);
        const fromTx: TransactionInterface = fromTxWithStatus.transaction;
        const targetOutputIndex = fromTx.outputs.findIndex((output) => {
          return generateAddress(output.lock) === address;
        });
        const inputAddresses: string[] = [];
        for (const input of fromTx.inputs) {
          const previousOutput = input.previous_output;
          const fromOutputTxWithStatus = await rpc.get_transaction(
            previousOutput.tx_hash
          );
          const fromOutputTx: TransactionInterface =
            fromOutputTxWithStatus.transaction;
          const o = fromOutputTx.outputs[+previousOutput.index];
          const lock = o.lock;
          inputAddresses.push(generateAddress(lock));
        }

        if (targetOutputIndex > -1) {
          const targetOutput = fromTx.outputs[targetOutputIndex];
          const sudtAmount: bigint = readBigUInt128LE(
            fromTx.outputs_data[targetOutputIndex]
          );
          const rechargeRecord: RecordEntity = {
            capacity: BigInt(targetOutput.capacity).toString(),
            sudt_amount: sudtAmount.toString(),
            sudt_token: sudtToken,
            type: "recharge",
            to_address: address,
            from_addresses: inputAddresses,
            transaction_hash: hash,
          };
          rechargeRecords.push(rechargeRecord);
        }

        const tx: TransactionInterface = this.getTx(txSkeleton, privateKey);
        const txHash: string = await transactionManager.send_transaction(tx);

        summarizeRecords = summarizeRecords.map((record) => {
          record.transaction_hash = txHash;
          return record;
        });

        const recordIds = await new Record().saveAll([
          ...summarizeRecords,
          ...rechargeRecords,
        ]);
        allRecordIds = allRecordIds.concat(recordIds);
      }
    }

    return allRecordIds;
  }

  async summarizeAll() {
    const addressEntities: AddressEntity[] = await this.knex
      .select()
      .from("addresses");
    const tipHeader = await this.getTipBlockHeader();

    for (const addressEntity of addressEntities) {
      const secpAddress: string = Address.generateSecpAddress(
        addressEntity.blake160
      );

      await this.summarizeCkb(
        addressEntity.account_id!,
        secpAddress,
        addressEntity.private_key,
        tipHeader
      );

      await this.summarizeSudt(
        addressEntity.account_id!,
        secpAddress,
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
  ) {
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

    let realCapacity: bigint = txSkeleton
      .get("outputs")
      .filter((output) => {
        const addr = generateAddress(output.cell_output.lock);
        return addr === toAddress;
      })
      .map((output) => BigInt(output.cell_output.capacity))
      .reduce((result, c) => result + c, 0n);

    realCapacity -= txSkeleton
      .get("inputs")
      .filter((input) => {
        const addr = generateAddress(input.cell_output.lock);
        return addr === toAddress;
      })
      .map((input) => BigInt(input.cell_output.capacity))
      .reduce((result, c) => result + c, 0n);

    const sudt_amount = sudtMode ? sudtAmount!.toString() : "0";

    const balance = await this.getBalance(accountId);

    if (realCapacity > BigInt(balance.capacity)) {
      throw new Error(
        `Capacity not enough! You want to withdraw ${realCapacity} but only ${balance.capacity}.`
      );
    }
    if (BigInt(sudt_amount) > BigInt(balance.sudt_amount)) {
      throw new Error(
        `Sudt amount not enough! You want to withdraw ${sudt_amount} but only ${balance.sudt_amount}.`
      );
    }

    const tx = this.getTx(txSkeleton, primaryPrivateKey);
    const txHash: string = await transactionManager.send_transaction(tx);

    const recordEntity: RecordEntity = {
      capacity: realCapacity.toString(),
      sudt_amount,
      sudt_token: sudtToken,
      type: "withdraw",
      to_address: toAddress,
      from_addresses: [primaryAddress],
      transaction_hash: txHash,
      account_id: accountId,
    };

    const recordId: number = await new Record().save(recordEntity);

    return {
      id: recordId,
      transaction_hash: txHash,
      account_id: accountId,
      capacity: realCapacity.toString(),
      sudt_amount,
      sudt_token: sudtToken,
    };
  }

  async getTransactions(accountId: number) {
    const recordModel = new Record();

    const records = await recordModel.getByAccountId(accountId);

    // "recharge" and "withdraw" types are enough.
    return records
      .filter((record) => {
        return ["recharge", "withdraw"].includes(record.type);
      })
      .map((record) => {
        return {
          transaction_hash: record.transaction_hash,
          capacity:
            record.type === "withdraw"
              ? (-BigInt(record.capacity)).toString()
              : record.capacity,
          sudt_amount:
            record.type === "withdraw"
              ? (-BigInt(record.sudt_amount)).toString()
              : record.sudt_amount,
          sudt_token: record.sudt_token,
          from_addresses: record.from_addresses,
          to_address: record.to_address,
        };
      });
  }

  async downloadCsv(accountId: number): Promise<string> {
    const records = await this.getTransactions(accountId);

    const fields: string[] = [
      "transaction_hash",
      "capacity",
      "sudt_token",
      "sudt_amount",
      "from_addresses",
      "to_address",
    ];

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(records);
    return csv;
  }

  async getBalance(
    accountId: number
  ): Promise<{
    capacity: string;
    sudt_amount: string;
  }> {
    const records = await this.getTransactions(accountId);

    const capacity = records
      .map((record) => BigInt(record.capacity))
      .reduce((result, c) => result + c, 0n);

    const sudtAmount = records
      .map((record) => BigInt(record.sudt_amount))
      .reduce((result, c) => result + c, 0n);

    return {
      capacity: capacity.toString(),
      sudt_amount: sudtAmount.toString(),
    };
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
