/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "device_status_keys";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.integer("device_id").unsigned().notNullable();
    table.string("status_key", 100).notNullable();
    table.string("name", 100).notNullable();
    table.boolean("is_shown").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["device_id", "status_key"], {
      indexName: "status_key_index",
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
