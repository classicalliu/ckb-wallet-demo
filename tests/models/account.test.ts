import test from "ava"
import knex from "knex"
import Account from "../../src/models/account"
const dbConfig = require("../../knexfile").test

const testUsername = "username"
const testPassword: string = "password"

test("encrypt & compare", async t => {
  const account = new Account()
  // @ts-ignore: Private method
  const digest = await account.encryptPassword(testPassword)
  // @ts-ignore: Private method
  const result = await account.checkPassword(testPassword, digest)

  t.is(result, true)
})

test("create", async t => {
  const k = knex(dbConfig)
  await k.migrate.latest()

  const account = new Account(k)
  await account.create(testUsername, testPassword)
  const result = await k.select("*").from("accounts")

  t.is(result.length, 1)
  t.is(result[0].username, testUsername)
})
