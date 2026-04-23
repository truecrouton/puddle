/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "pairs";

exports.up = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.index(["topic_id", "name", "value", "created_at"], "topic_id_name_value_created");
    table.index(["topic_id", "is_latest", "is_object", "name"], "topic_id_latest_object_name");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(["topic_id", "name", "value", "created_at"], "topic_id_name_value_created");
    table.dropIndex(["topic_id", "is_latest", "is_object", "name"], "topic_id_latest_object_name");
  });
};
