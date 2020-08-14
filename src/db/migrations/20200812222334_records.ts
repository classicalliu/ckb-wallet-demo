import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("records", (table) => {
    table.increments();
    table.bigInteger("capacity").unsigned().notNullable();
    table.string("sudt_amount").notNullable().defaultTo("");
    table.string("type").notNullable();
    table.string("to_address").notNullable();
    table.json("from_addresses").notNullable();
    table.string("transaction_hash").notNullable();

    table.integer("account_id").index().references("id").inTable("accounts");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("records");
}
