// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: "better-sqlite3",
  connection: {
    filename: "data/puddle.sqlite",
  },
  useNullAsDefault: true,
  migrations: {
    directory: "data/migrations",
  },
  seeds: {
    directory: "data/seeds",
  },
};
