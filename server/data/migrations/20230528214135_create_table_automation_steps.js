/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automation_steps";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.integer("automation_id").unsigned().notNullable();
    table
      .enu("kind", ["if", "notify", "publish", "wait"], {
        useNative: true,
      })
      .notNullable();
    table.integer("conditional_step_id").unsigned().notNullable();
    table.boolean("is_else_step").notNullable().defaultTo(false);
    table.integer("topic_id").unsigned();
    table.string("message");
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
