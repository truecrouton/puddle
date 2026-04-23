/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automations";
const tempTableName = "automations_temp";

exports.up = function (knex) {
  return knex.schema
    .createTable(tempTableName, (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table
        .enu("trigger", ["time", "sun", "topic", "user"], {
          useNative: true,
        })
        .notNullable();
      table.time("trigger_at");
      table.enu(
        "position",
        [
          "solarNoon",
          "nadir",
          "sunrise",
          "sunset",
          "sunriseEnd",
          "sunsetStart",
          "dawn",
          "dusk",
          "nauticalDawn",
          "nauticalDusk",
          "nightEnd",
          "night",
          "goldenHourEnd",
          "goldenHour",
          "morning",
          "afternoon",
          "lateMorning",
          "evening",
        ],
        {
          useNative: true,
        }
      );
      table.integer("topic_id").unsigned();
      table.string("trigger_key");
      table.float("trigger_value");
      table.boolean("is_control_shown").notNullable().defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => knex(tableName).select("*"))
    .then((rows) => {
      if (rows.length > 0) return knex(tempTableName).insert(rows);
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
      table.string("name");
      table
        .enu("trigger", ["time", "sun", "topic", "user"], {
          useNative: true,
        })
        .notNullable();
      table.time("trigger_at");
      table.enu(
        "position",
        [
          "solarNoon",
          "nadir",
          "sunrise",
          "sunset",
          "sunriseEnd",
          "sunsetStart",
          "dawn",
          "dusk",
          "nauticalDawn",
          "nauticalDusk",
          "nightEnd",
          "night",
          "goldenHourEnd",
          "goldenHour",
        ],
        {
          useNative: true,
        }
      );
      table.integer("topic_id").unsigned();
      table.string("trigger_key");
      table.float("trigger_value");
      table.boolean("is_control_shown").notNullable().defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() =>
      knex(tableName)
        .where(function () {
          this.whereIn("position", ["morning", "lateMorning", "evening", "afternoon"]).andWhere({
            trigger: "sun",
          });
        })
        .select("*")
        .then(function (rows) {
          knex("automation_steps")
            .whereIn(
              "automation_id",
              rows.map((r) => r.id)
            )
            .then(function (steps) {
              knex("automation_conditions")
                .del()
                .whereIn(
                  "step_id",
                  steps.map((s) => s.id)
                )
                .then();
              knex("automation_steps")
                .del()
                .whereIn(
                  "id",
                  steps.map((s) => s.id)
                )
                .then();
            });
          knex(tableName)
            .del()
            .whereIn(
              "id",
              rows.map((r) => r.id)
            )
            .then();
        })
        .then(() => knex(tableName).select("*"))
        .then((rows) => {
          if (rows.length > 0) {
            return knex(tempTableName).insert(rows);
          }
        })
        .then(() => knex.schema.dropTable(tableName))
        .then(() => knex.schema.renameTable(tempTableName, tableName))
    );
};
