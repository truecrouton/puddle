/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "devices";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("id");
    table.integer("topic_id").unsigned().notNullable();
    table.string("name").notNullable();
    table
      .enu("kind", ["controlling", "dimmable", "informational", "positionable", "toggleable"], {
        useNative: true,
      })
      .notNullable();
    table.string("set_key");
    table.string("state_key").notNullable();
    table.string("set_suffix");
    table.integer("value_on");
    table.integer("value_off");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["topic_id", "set_key"], {
      indexName: "set_key_index",
    });
    table.unique(["topic_id", "state_key"], {
      indexName: "state_key_index",
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
