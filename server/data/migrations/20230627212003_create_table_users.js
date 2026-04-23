/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "users";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.string("username", 30);
    table.string("password", 100);
    table.string("name", 50);
    table.boolean("is_admin").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["username"], {
      indexName: "username_index",
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
