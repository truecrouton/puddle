/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automation_conditions";
const tempTableName = "automation_conditions_temp";

exports.up = function (knex) {
  return knex.schema
    .createTable(tempTableName, (table) => {
      table.increments("id");
      table.integer("step_id").unsigned().notNullable();
      table
        .enu("kind", ["and", "eq", "or", "gt", "gte", "lt", "lte", "neq", "inc", "dec", "lgt", "llt", "leq", "lneq"], {
          useNative: true,
        })
        .notNullable();
      table
        .enu("left_operand_kind", ["preset", "topic", "value"], {
          useNative: true,
        })
        .notNullable();
      table.enu("left_preset", ["date", "time", "month", "day", "season_northern", "season_southern", "sun_position"], {
        useNative: true,
      });
      table.integer("left_topic_id").unsigned();
      table.string("left_topic_key");
      table.float("left_value");
      table
        .enu("right_operand_kind", ["preset", "topic", "value"], {
          useNative: true,
        })
        .notNullable();
      table.enu(
        "right_preset",
        ["date", "time", "month", "day", "season_northern", "season_southern", "sun_position"],
        {
          useNative: true,
        }
      );
      table.integer("right_topic_id").unsigned();
      table.string("right_topic_key");
      table.float("right_value");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => knex(tableName).select("*"))
    .then((rows) => {
      if (rows.length > 0) {
        return knex(tempTableName).insert(rows);
      }
    })
    .then(() => knex.schema.dropTable(tableName))
    .then(() => knex.schema.renameTable(tempTableName, tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .createTable(tempTableName, (table) => {
      table.increments("id");
      table.integer("step_id").unsigned().notNullable();
      table
        .enu("kind", ["and", "eq", "or", "gt", "gte", "lt", "lte", "neq", "inc", "dec"], {
          useNative: true,
        })
        .notNullable();
      table
        .enu("left_operand_kind", ["preset", "topic", "value"], {
          useNative: true,
        })
        .notNullable();
      table.enu("left_preset", ["date", "time", "month", "day", "season_northern", "season_southern", "sun_position"], {
        useNative: true,
      });
      table.integer("left_topic_id").unsigned();
      table.string("left_topic_key");
      table.float("left_value");
      table
        .enu("right_operand_kind", ["preset", "topic", "value"], {
          useNative: true,
        })
        .notNullable();
      table.enu(
        "right_preset",
        ["date", "time", "month", "day", "season_northern", "season_southern", "sun_position"],
        {
          useNative: true,
        }
      );
      table.integer("right_topic_id").unsigned();
      table.string("right_topic_key");
      table.float("right_value");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => knex(tableName).whereNotIn("kind", ["lgt", "llt", "leq", "lneq"]).select("*"))
    .then((rows) => {
      if (rows.length > 0) {
        return knex(tempTableName).insert(rows);
      }
    })
    .then(() => knex.schema.dropTable(tableName))
    .then(() => knex.schema.renameTable(tempTableName, tableName));
};
