/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = "automation_expressions";

const opMap = {
  dec: '<<',
  eq: '==',
  gt: '>',
  inc: '>>',
  leq: '_=',
  lgt: '_>',
  llt: '_<',
  lt: '<',
  neq: '!='
};

const wasOps = ['lgt', 'llt', 'leq'];

async function getTopicName(knex, topicId) {
  let topic = '';
  const rows = await knex('topics').where('id', topicId).select("*");

  if (rows.length !== 1) {
    console.error('Cannot find topic of topic_id: ' + topicId);
    throw new Error('Cannot find topic of topic_id: ' + topicId);
  }
  topic = rows[0].topic.split('/')[1];

  return topic;
}

function numberOrString(value) {
  const numeric = Number(value);
  return isNaN(numeric) ? `'${value}'` : numeric;
}

async function rewrite(knex, condition) {
  let exprR = '';
  let exprL = '';
  let wasCond = '';

  switch (condition.left_operand_kind) {
    case "preset":
      exprL += condition.left_preset;
      break;
    case "topic":
      const topicName = await getTopicName(knex, condition.left_topic_id);
      exprL += `${topicName}.${condition.left_topic_key}`;
      break;
    case "value":
      if (wasOps.includes(condition.kind)) {
        const vals = condition.left_value.split(',');
        exprL += numberOrString(vals[0]);
        wasCond = `[${vals[1].trim()}]`;
      } else { exprL += numberOrString(condition.left_value); }
      break;
  }

  switch (condition.right_operand_kind) {
    case "preset":
      exprR += condition.right_preset;
      break;
    case "topic":
      const topicName = await getTopicName(knex, condition.right_topic_id);
      exprR += `${topicName}.${condition.right_topic_key}`;
      break;
    case "value":
      if (wasOps.includes(condition.kind)) {
        const vals = condition.right_value.split(',');
        exprR += numberOrString(vals[0]);
        wasCond = `[${vals[1].trim()}]`;
      } else { exprR += numberOrString(condition.right_value); }
      break;
  }

  const op = ` ${opMap[condition.kind]}${wasCond} `;

  return `${exprL}${op}${exprR}`;
}

exports.up = function (knex) {
  return knex.schema.createTable(tableName, (table) => {
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
  }).then(() => knex('automation_steps').select("*"))
    .then(async (steps) => {
      if (steps.length == 0) return [];

      const newRows = [];
      for (s of steps) {
        let expr = '';
        let newRow = {
          id: s.id,
          automation_id: s.automation_id,
          kind: s.kind,
          is_else_step: s.is_else_step,
          expression: null,
          conditional_expression_id: s.conditional_step_id,
          topic_id: s.topic_id,
          message: s.message,
          created_at: s.created_at
        };
        switch (s.kind) {
          case "if":
            const exprs = [];
            const conds = await knex('automation_conditions').where("step_id", s.id).select("*");

            for (cond of conds) {
              exprs.push((await rewrite(knex, cond)).trim());
            }
            expr = exprs.join(' AND ');
            newRow.expression = expr;
            break;
          case "wait":
          case "notify":
          case "publish":
            break;
        }
        newRows.push(newRow);
      }
      return newRows;
    }).then((rows) => {
      if (!rows.length) return;
      return knex(tableName).insert(rows);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
