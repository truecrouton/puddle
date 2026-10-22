import z from "zod";

export const zodEmptyInputSchema = z.object({});

export const zodIdInputSchema = z.object({ id: z.coerce.number().int().nonnegative('The query was invalid.') });

export const zodSetDeviceInputSchema = z.object({
    deviceId: z.coerce.number().int().nonnegative(),
    state: z.string().min(1).max(30)
});

export const zodSignInInputSchema = z.object({
    username: z.string().min(1, 'Please provide your username.').max(30, 'Username must be less that 30 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(30, 'Password must be less than 30 characters.'),
});

export const zodSignUpInputSchema = z.object({
    isAdmin: z.boolean(),
    name: z.string().min(1, 'Please provide your name.').max(30, 'Name must be less that 30 characters.'),
    username: z.string().min(1, 'Please provide your username.').max(30, 'Username must be less that 30 characters.'),
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
    name: z.string().min(1, 'Please provide a name.').max(50, 'Name must be less that 50 characters.'),
    setKey: z.string().min(1, 'Please provide a set key.').max(30, 'Set key must be less that 30 characters.'),
    setSuffix: z.string().min(1, 'Please provide a set suffix.').max(30, 'Set suffix must be less that 30 characters.'),
    stateKey: z.string().min(1, 'Please provide a state key.').max(30, 'State key must be less that 30 characters.'),
    topicId: z.coerce.number().int().positive('Please select a topic.'),
    valueOff: z.string().min(1, 'Please provide an off value.').max(30, 'Off value must be less that 30 characters.'),
    valueOn: z.string().min(1, 'Please provide an on value.').max(30, 'On value must be less that 30 characters.'),
});