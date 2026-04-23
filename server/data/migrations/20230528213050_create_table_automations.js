/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automations";

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
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
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
