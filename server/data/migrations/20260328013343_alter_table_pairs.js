/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "pairs";

exports.up = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(["topic_id", "is_latest"], "topic_id_is_latest_index");
    table.dropIndex(["topic_id", "is_latest", "is_object", "name"], "topic_id_latest_object_name");
    table.dropColumn('is_latest');
    table.index(["topic_id", "is_object", "name"], "topic_id_object_name");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.boolean("is_latest").notNullable().defaultTo(1);
    table.index(["topic_id", "is_latest"], "topic_id_is_latest_index");
    table.index(["topic_id", "is_latest", "is_object", "name"], "topic_id_latest_object_name");
    table.dropIndex(["topic_id", "is_object", "name"], "topic_id_object_name");
  });
};
