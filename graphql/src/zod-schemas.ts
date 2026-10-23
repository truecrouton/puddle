import z from "zod";

export const zodEmptyInputSchema = z.object({});

export const zodIdInputSchema = z.object({ id: z.coerce.number().int().positive('The query was invalid.') });

export const zodSetDeviceInputSchema = z.object({
    deviceId: z.coerce.number().int().nonnegative(),
    state: z.string().min(1).max(30)
});

export const zodSignInInputSchema = z.object({
    username: z.string().min(1, 'Please provide your username.').max(30, 'Username must be less than 30 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(30, 'Password must be less than 30 characters.'),
});

export const zodSignUpInputSchema = z.object({
    isAdmin: z.boolean(),
    name: z.string().min(1, 'Please provide your name.').max(30, 'Name must be less than 30 characters.'),
    username: z.string().min(1, 'Please provide your username.').max(30, 'Username must be less than 30 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(30, 'Password must be less than 30 characters.'),
    authPhrase: z.string().min(8, 'Auth phrase must be at least 8 characters.').max(30, 'Auth phrase must be less than 30 characters.'),
});

export const zodUpsertTopicInputSchema = z.object({
    id: z.coerce.number().int().nonnegative(),
    topic: z.string().min(1, 'Please provide a topic.').max(100, 'Topic must be less than 100 characters.')
});

export const zodUpsertDeviceSchema = z.object({
    id: z.coerce.number().int().nonnegative(),
    kind: z.string().refine(
        (val) => ['positionable', 'toggleable', 'dimmable', 'controlling', 'informational'].includes(val),
        { error: 'Please select a device kind.' }
    ),
    name: z.string().min(1, 'Please provide a name.').max(50, 'Name must be less than 50 characters.'),
    setKey: z.string().min(1, 'Please provide a set key.').max(30, 'Set key must be less than 30 characters.'),
    setSuffix: z.string().min(1, 'Please provide a set suffix.').max(30, 'Set suffix must be less than 30 characters.'),
    stateKey: z.string().min(1, 'Please provide a state key.').max(30, 'State key must be less than 30 characters.'),
    topicId: z.coerce.number().int().positive('Please select a topic.'),
    valueOff: z.string().min(1, 'Please provide an off value.').max(30, 'Off value must be less than 30 characters.'),
    valueOn: z.string().min(1, 'Please provide an on value.').max(30, 'On value must be less than 30 characters.'),
});

export const zodUpsertExpressionSchema = z.object({
    id: z.coerce.number().int().nonnegative(),
    automationId: z.coerce.number().int().nonnegative(),
    kind: z.string().max(10),
    isElseStep: z.boolean(),
    expression: z.string().max(300, 'Expression must be less than 300 characters.').nullable(),
    conditionalExpressionId: z.coerce.number().int().nonnegative(),
    topicId: z.coerce.number().int().nonnegative(),
    message: z.string().max(500, 'Message must be less than 500 characters.').nullable(),
    deviceId: z.coerce.number().int().nonnegative(),
    state: z.string().max(30, 'State must be less than 30 characters.').nullable(),
}).refine((data) => {
    if (data.conditionalExpressionId > 0) return ["notify", "publish", "wait", "device"].includes(data.kind);
    else return ["if", "notify", "publish", "wait", "device"].includes(data.kind);
}, { error: 'Incorrect kind', path: ['kind'] }).refine((data) => {
    if (data.kind == 'if') return data.expression?.length ?? 0 > 0;
    return true;
}, { error: 'Please provide an expression.', path: ['expression'] }).refine((data) => {
    if (["notify", "publish", "wait", "device"].includes(data.kind)) return data.conditionalExpressionId > 0;
    return true;
}, { error: 'Invalid conditional expression.', path: ['conditionalExpressionId'] }).refine((data) => {
    if (data.kind == 'publish') return data.topicId > 0;
    return true;
}, { error: 'Please select a topic.', path: ['topicId'] }).refine((data) => {
    if (['publish', 'notify'].includes(data.kind)) {
        if (!data.message) return false;
        try {
            JSON.parse(data.message);
            return true;
        } catch (error) {
            return false;
        }
    }
    return true;
}, { error: 'Message must be a valid JSON string.', path: ['message'] }).refine((data) => {
    if (data.kind == 'device') return data.deviceId > 0;
    return true;
}, { error: 'Please select a device.', path: ['deviceId'] }).refine((data) => {
    if (data.kind == 'device') return data.state?.length ?? 0 > 0;
    return true;
}, { error: 'Please provide a state.', path: ['state'] });