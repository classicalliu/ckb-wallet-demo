import test from "ava";
import Account from "../../src/models/account";
import { generateConnection } from "../../src/db/connection";

const testUsername = "username";
const testPassword: string = "password";

test("encrypt & compare", async (t) => {
  const account = new Account();
  // @ts-ignore: Private method
  const digest = await account.encryptPassword(testPassword);
  // @ts-ignore: Private method
  const result = await account.checkPassword(testPassword, digest);

  t.is(result, true);
});

test("create", async (t) => {
  const knex = generateConnection();
  await knex.migrate.latest();

  const account = new Account(knex);
  await account.create(testUsername, testPassword);
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

  await account.create(testUsername, testPassword);
  const result2 = await account.get(testUsername);

  t.is(result2.username, testUsername);
});
