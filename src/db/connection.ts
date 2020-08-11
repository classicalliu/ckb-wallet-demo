import Knex from "knex";

const configs = require("./knexfile");
const nodeEnv = process.env.NODE_ENV || "development";
const config = configs[nodeEnv];
export const defaultConnection = Knex(config);

export function generateConnection(dbConfig: any = config) {
  return Knex(dbConfig);
}
