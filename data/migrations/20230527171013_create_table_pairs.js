/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "pairs";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.integer("topic_id").unsigned().notNullable();
    table.integer("pair_id").unsigned();
    table.string("name").notNullable();
    table.float("value").notNullable();
    table.boolean("is_object").notNullable();
    table.boolean("is_latest").notNullable().defaultTo(1);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
