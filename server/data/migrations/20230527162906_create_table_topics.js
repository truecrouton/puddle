/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "topics";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.string("topic").notNullable();
    table.string("description");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["topic"], {
      indexName: "topic_index",
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
