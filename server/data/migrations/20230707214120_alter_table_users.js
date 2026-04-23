/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "users";
const tempTableName = "users_temp";

exports.up = function (knex) {
  return knex.schema
    .alterTable(tableName, (table) => {
      table.dropUnique("username", "username_index");
    })
    .then(() => {
      return knex.schema
        .createTable(tempTableName, (table) => {
          table.increments("id");
          table.string("username", 30).notNullable();
          table.string("password", 100).notNullable();
          table.string("name", 50);
          table.boolean("is_admin").notNullable().defaultTo(false);
          table.string("session_id", 100);
          table.timestamp("session_created_at");
          table.timestamp("created_at").defaultTo(knex.fn.now());
          table.unique(["username"], {
            indexName: "username_index",
          });
          table.unique(["session_id"], {
            indexName: "session_id_index",
          });
        })
        .then(() => knex(tableName).select("*"))
        .then((rows) => {
          if (rows.length > 0) {
            return knex(tempTableName).insert(rows);
          }
        });
    })
    .then(() => knex.schema.dropTable(tableName))
    .then(() => knex.schema.renameTable(tempTableName, tableName))
    .then(() => knex.schema.dropTableIfExists(tempTableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .createTable(tempTableName, (table) => {
      table.increments("id");
      table.string("username", 30);
      table.string("password", 100);
      table.string("name", 50);
      table.boolean("is_admin").notNullable().defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => knex(tableName).select("id", "username", "password", "name", "is_admin", "created_at"))
    .then((rows) => {
      if (rows.length > 0) {
        return knex(tempTableName).insert(rows);
      }
    })
    .then(() => knex.schema.dropTable(tableName))
    .then(() => knex.schema.renameTable(tempTableName, tableName))
    .then(() => knex.schema.dropTableIfExists(tempTableName))
    .then(function () {
      return knex.schema.alterTable(tableName, (table) => {
        table.unique(["username"], { indexName: "username_index" });
      });
    });
};
