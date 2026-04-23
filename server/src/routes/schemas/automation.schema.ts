import Joi from "joi";

export const AutomationExpressionSchema = Joi.object({
  id: Joi.number().integer().min(0),
  kind: Joi.string().valid("if", "notify", "publish", "wait").required(),
  is_else_step: Joi.boolean(),
  expression: Joi.string().when('kind', {
    is: 'if', then: Joi.string().max(300).required().custom((value, helpers) => {
      const { OhmValidate } = require('../../expressions');
      return OhmValidate(value, helpers);
    })
  }),
  conditional_expression_id: Joi.number().when('kind', { is: 'else', then: Joi.number().integer().min(1).required() }),
  topic_id: Joi.number().when('kind', { is: 'publish', then: Joi.number().integer().min(1).required() }),
  message: Joi.string().when('kind', { is: 'publish', then: Joi.string().max(100).required() })
});

export const AutomationIdSchema = Joi.object({
  automation_id: Joi.number().integer().min(1).required()
});

export const AutomationSchema = Joi.object({
  id: Joi.number().integer().min(0).required(),
  name: Joi.string().max(100).required(),
  trigger: Joi.string().valid("time", "sun", "topic", "user").required(),
  trigger_at: Joi.string().when('trigger', { is: 'time', then: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required() }),
  position: Joi.string().when('trigger', { is: 'sun', then: Joi.string().valid("solarNoon", "nadir", "sunrise", "sunset", "sunriseEnd", "sunsetStart", "dawn", "dusk", "nauticalDawn", "nauticalDusk", "nightEnd", "night", "goldenHourEnd", "goldenHour", "morning", "afternoon", "lateMorning", "evening").required() }),
  topic_id: Joi.number().when('trigger', { is: 'topic', then: Joi.number().integer().min(1).required() }),
  trigger_key: Joi.string().when('trigger', { is: 'topic', then: Joi.string().min(0).max(100) }),
  trigger_value: Joi.string().when('trigger', { is: 'topic', then: Joi.string().min(0).max(100) }),
  is_control_shown: Joi.boolean().when('trigger', { is: 'user', then: Joi.required() })
});

// Payloads
export const AutomationDeletePayloadSchema = AutomationIdSchema;
export const AutomationExpressionSetupPayloadSchema = Joi.object({
  automation_id: Joi.number().integer().min(1).required(),
  expressions: Joi.array().items(AutomationExpressionSchema.keys({
    nested_expressions: Joi.array().items(AutomationExpressionSchema.keys({
      kind: Joi.string().valid("notify", "publish", "wait").required()
    }))
  })
  ).required()
});
export const AutomationGetPayloadSchema = AutomationIdSchema.keys({
  with_details: Joi.bool().default(true)
});
export const AutomationRunPayloadSchema = AutomationIdSchema;
export const AutomationsGetPayloadSchema = Joi.object().valid({}).required();
export const AutomationSetupPayloadSchema = AutomationSchema;