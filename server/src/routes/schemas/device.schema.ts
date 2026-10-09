import Joi from "joi";

export const DeviceIdSchema = Joi.object({
    device_id: Joi.number().integer().min(1).required()
});

export const DeviceSchema = Joi.object({
    device_id: Joi.number().integer().min(0).required(),
    topic_id: Joi.number().integer().min(1).required(),
    kind: Joi.string().valid("controlling", "dimmable", "informational", "positionable", "toggleable").required(),
    name: Joi.string().max(100).required(),
    set_key: Joi.string().when('kind', { is: ['dimmable', 'positionable', 'toggleable'], then: Joi.string().token().max(100).required() }),
    state_key: Joi.string().token().max(100).required(),
    set_suffix: Joi.string().when('kind', { is: ['dimmable', 'positionable', 'toggleable'], then: Joi.string().token().max(100).required() }),
    value_off: Joi.string().when('kind', { is: ['dimmable', 'positionable', 'toggleable'], then: Joi.string().token().max(100).required() }),
    value_on: Joi.string().when('kind', { is: ['dimmable', 'positionable', 'toggleable'], then: Joi.string().token().max(100).required() }),
});

// Payloads
export const DeviceGetPayloadSchema = DeviceIdSchema;
export const DeviceSetPayloadSchema = DeviceIdSchema.keys({
    state: Joi.number().min(0).max(100).required()
});
export const DeviceSetupPayloadSchema = DeviceSchema;
export const DevicesGetPayloadSchema = Joi.object().valid({}).required();
export const DeviceStatusGetPayloadSchema = DeviceIdSchema;
export const DeviceStatusSetupPayloadSchema = Joi.object({
    status_key_id: Joi.number().integer().min(0).required(),
    device_id: Joi.number().integer().min(1).required(),
    name: Joi.string().max(100).required(),
    status_key: Joi.string().token().max(100).required(),
    is_shown: Joi.boolean().required(),
});
