import Knex from "knex";
import { defaultConnection } from "../db/connection";

export interface RecordEntity {
  capacity: string;
  // fee: bigint
  sudt_amount: string;
  sudt_token?: string;
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
    console.log("Record entities saved:", ids);
    return ids[0];
  }

  async saveAll(recordEntities: RecordEntity[]): Promise<number[]> {
    console.log(
      "Record save recordEntities:",
      JSON.stringify(recordEntities, null, 2)
    );
    const ids: number[] = await this.knex<RecordEntity>("records").insert(
      recordEntities
    );
    console.log("Record entities saved:", ids);
    return ids;
  }

  async getByAccountId(accountId: number): Promise<RecordEntity[]> {
    const records = await this.knex.select().from("records").where({
      account_id: accountId,
    });

    return records;
  }
}
