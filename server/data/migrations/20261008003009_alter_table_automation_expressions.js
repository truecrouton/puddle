/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automation_expressions";
const tempTableName = "automation_expressions_temp";

exports.up = function (knex) {
    return knex.schema
        .createTable(tempTableName, (table) => {
            table.increments("id");
            table.integer("automation_id").unsigned().notNullable();
            table
                .enu("kind", ["if", "notify", "publish", "wait", "device"], {
                    useNative: true,
                })
                .notNullable();
            table.boolean("is_else_step").notNullable().defaultTo(false);
            table.string("expression");
            table.integer("conditional_expression_id").unsigned().notNullable();
            table.integer("topic_id").unsigned();
            table.string("message");
            table.integer("device_id").unsigned();
            table.integer("state");
            table.timestamp("created_at").defaultTo(knex.fn.now());
        })
        .then(() => knex.raw(`
            INSERT INTO ${tempTableName} (id, automation_id, kind, is_else_step, expression, conditional_expression_id, topic_id, message, created_at)
            SELECT id, automation_id, kind, is_else_step, expression, conditional_expression_id, topic_id, message, created_at FROM ${tableName}
            `))
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
            table.integer("automation_id").unsigned().notNullable();
            table
                .enu("kind", ["if", "notify", "publish", "wait"], {
                    useNative: true,
                })
                .notNullable();
            table.boolean("is_else_step").notNullable().defaultTo(false);
            table.string("expression");
            table.integer("conditional_expression_id").unsigned().notNullable();
            table.integer("topic_id").unsigned();
            table.string("message");
            table.timestamp("created_at").defaultTo(knex.fn.now());
        })
        .then(() => knex.raw(`
            INSERT INTO ${tempTableName} (id, automation_id, kind, is_else_step, expression, conditional_expression_id, topic_id, message, created_at)
            SELECT id, automation_id, kind, is_else_step, expression, conditional_expression_id, topic_id, message, created_at FROM ${tableName} WHERE kind <> 'device'
            `))
        .then(() => knex.schema.dropTable(tableName))
        .then(() => knex.schema.renameTable(tempTableName, tableName));
};
