import test from "ava";
import Account from "../../src/models/account";
import { generateConnection } from "../../src/db/connection";

const testUsername = "username";

test("create", async (t) => {
  const knex = generateConnection();
  await knex.migrate.latest();

  const account = new Account(knex);
  await account.create(testUsername);
  const result = await knex.select("*").from("accounts");

  t.is(result.length, 1);
  t.is(result[0].username, testUsername);
});

test("get", async (t) => {
  const knex = generateConnection();
  await knex.migrate.latest();

  const account = new Account(knex);
  const result = await account.get(testUsername);
  t.is(result, undefined);

  await account.create(testUsername);
  const result2 = await account.get(testUsername);

  t.is(result2.username, testUsername);
});
