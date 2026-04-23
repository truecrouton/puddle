/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automations";

exports.up = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.index(["trigger"], "trigger");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(["trigger"], "trigger");
  });
};
