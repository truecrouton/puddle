/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "pairs";

exports.up = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.index(["topic_id", "is_latest"], "topic_id_is_latest_index");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(["topic_id", "is_latest"], "topic_id_is_latest_index");
  });
};
