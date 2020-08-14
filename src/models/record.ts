import Knex from "knex";
import { defaultConnection } from "../db/connection";

export interface RecordEntity {
  capacity: string;
  // fee: bigint
  sudt_amount: string;
  type: "recharge" | "withdraw" | "summarize";
  to_address: string;
  from_addresses: string[];
  transaction_hash: string;
  account_id?: number;
}

export class Record {
  private knex: Knex;

  constructor(knex: Knex = defaultConnection) {
    this.knex = knex;
  }

  async save(recordEntity: RecordEntity): Promise<number> {
    console.log("Record save recordEntity:", recordEntity);
    const ids: number[] = await this.knex<RecordEntity>("records").insert(
      recordEntity
    );
    console.log("Record save entity:", ids);
    return ids[0];
  }
}
