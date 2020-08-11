// Update with your config settings.

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
    migrations: {
      directory: __dirname + "/src/db/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  test: {
    client: "sqlite3",
    connection: ":memory:",
    migrations: {
      directory: __dirname + "/src/db/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  staging: {
    client: "sqlite3",
    connection: {
      filename: "./staging.sqlite3",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/src/db/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },

  production: {
    client: "sqlite3",
    connection: {
      filename: "./prod.sqlite3",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/src/db/migrations",
      extension: "ts",
    },
    useNullAsDefault: true,
  },
};
