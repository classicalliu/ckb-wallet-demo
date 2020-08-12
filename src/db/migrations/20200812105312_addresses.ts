import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("addresses", (table) => {
    table.increments();
    table.string("blake160").notNullable().unique();
    table.string("public_key").notNullable().unique();
    table.string("private_key").notNullable().unique();
    table.integer("account_id").index().references("id").inTable("accounts");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("addresses");
}
