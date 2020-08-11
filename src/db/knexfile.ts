// Update with your config settings.

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: __dirname + "/../../dev.sqlite3",
    },
    migrations: {
      directory: __dirname + "/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  test: {
    client: "sqlite3",
    connection: ":memory:",
    migrations: {
      directory: __dirname + "/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  staging: {
    client: "sqlite3",
    connection: {
      filename: __dirname + "/../../staging.sqlite3",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  production: {
    client: "sqlite3",
    connection: {
      filename: __dirname + "/../../prod.sqlite3",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },
};
