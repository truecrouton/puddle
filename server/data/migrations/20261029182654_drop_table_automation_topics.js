/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automation_topics";

exports.up = function (knex) {
    return knex.schema.dropTable(tableName);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.down = function (knex) {
    return knex.schema.createTable(tableName, (table) => {
        table.increments("id");
        table.integer("automation_id").unsigned().notNullable();
        table.integer("topic_id").unsigned().notNullable();
    }).then(() => knex('automation_expressions').where("kind", "if").select("*"))
        .then(async (exprs) => {
            if (exprs.length == 0) return [];

            const topics = await knex('topics').select("*");

            const newRows = [];
            for (e of exprs) {
                for (t of topics) {
                    const topicSegs = t.topic.split('/');
                    if (topicSegs.length != 2) continue;

                    if (e.expression.toLowerCase().includes(`${topicSegs[1].toLowerCase()}.`)) {
                        newRows.push({
                            automation_id: e.automation_id,
                            topic_id: t.id
                        });
                    }
                }
            }

            return newRows;
        }).then((rows) => {
            if (!rows.length) return;
            return knex(tableName).insert(rows);
        });
};
