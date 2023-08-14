/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "charts";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.string("name").notNullable();
    table.integer("topic_id").unsigned().notNullable();
    table.string("key").notNullable();
    table.boolean('is_favorite').notNullable().defaultTo(false);
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
