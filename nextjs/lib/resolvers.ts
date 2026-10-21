import { ApolloServerContext } from '@/app/api/graphql/route';
import { Resolvers, Device, Topic, ResolverFn, SignInInput, UpsertTopicInput, SignUpInput, User, Favorite, Control, Automation, Expression, Chart, SetDeviceInput } from '@/generated/resolvers-types';
import { keysToCamelCase } from '@/lib/case-converter';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { UpsertDeviceInput } from '@/generated/gql/graphql';
import { ZodType } from 'zod';
import { GraphQLError } from 'graphql';
import { zodEmptyInputSchema, zodIdInputSchema, zodSetDeviceInputSchema, zodSignInInputSchema, zodSignUpInputSchema, zodUpsertDeviceSchema, zodUpsertTopicInputSchema } from './zod-schemas';
import dotenv from 'dotenv';
import path from 'path';

const validateInput = <TResult, TParent, TContext, TArgs>(
    schema: ZodType<any>,
    resolverFn: ResolverFn<TResult, TParent, TContext, TArgs>,
    options = { protected: true }
): ResolverFn<TResult, TParent, TContext, TArgs> => {
    return async (parent, args, context, info) => {
        if (options.protected && !(context as ApolloServerContext).userId) {
            throw new GraphQLError('Authentication Error');
        };

        // Determine what to validate (e.g., args.input if it exists, or whole args)
        const dataToValidate = (args as any).input !== undefined ? (args as any).input : args;

        const result = schema.safeParse(dataToValidate);

        if (!result.success) {
            throw new GraphQLError('Validation Error', {
                extensions: {
                    code: 'BAD_USER_INPUT',
                    validationErrors: result.error.format(),
                },
            });
        }

        // Optional: overwrite with parsed/coformed data (like defaults or trims)
        if ((args as any).input !== undefined) {
            (args as any).input = result.data;
        } else {
            args = result.data as TArgs;
        }

        return resolverFn(parent, args, context, info);
    };
};

export const resolvers: Resolvers = {
    Automation: {
        expressions: async (parent: { id: number; }, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT automation_expressions.id, automation_expressions.kind, expression, is_else_step, automation_expressions.topic_id, conditional_expression_id, topic, message, device_id, devices.name as device_name, devices.kind as device_kind, state FROM automation_expressions LEFT JOIN topics on topics.id=automation_expressions.topic_id LEFT JOIN devices on devices.id=automation_expressions.device_id WHERE automation_id=?');
            const expressions = stmt.all(parent.id) as Expression[] | undefined;

            if (!expressions) return [];

            const camelExpressions = expressions.map((e) => keysToCamelCase(e) as Expression);
            return camelExpressions;
        }
    },
    Device: {
        topic: async (parent: { topicId: number; }, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT * FROM topics WHERE id=?');
            const topic = stmt.get(parent.topicId) as Topic | undefined;

            if (!topic) return null;
            return keysToCamelCase(topic);
        }
    },
    Topic: {
        devices: async (parent: { id: number; }, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id, name, kind FROM devices where topic_id=?');
            const devices = stmt.all(parent.id) as Device[] | undefined;

            if (!devices) return [];

            const camelDevices = devices.map((d) => keysToCamelCase(d) as Device);
            return camelDevices;
        },
        automations: async (parent: { id: number; }, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id, name, trigger FROM automations WHERE trigger=\'topic\' AND topic_id=?');
            const automations = stmt.all(parent.id) as Automation[] | undefined;

            if (!automations) return [];

            const camelAutomations = automations.map((a) => keysToCamelCase(a) as Automation);
            return camelAutomations;
        },
        usedInAutomations: async (parent: { id: number; }, _input, context: ApolloServerContext) => {
            const expressionStmt = context.db.prepare('SELECT automation_id as id, automations.name, trigger FROM automation_expressions LEFT JOIN automations on automations.id=automation_expressions.automation_id LEFT JOIN devices ON devices.id=automation_expressions.device_id WHERE automation_expressions.topic_id=? OR devices.topic_id=?');
            const conditionalStmt = context.db.prepare('SELECT automation_id as id, name, trigger FROM automation_topics LEFT JOIN automations ON automations.id=automation_topics.automation_id WHERE automation_topics.topic_id=?');

            const usedIn = new Map();
            expressionStmt.all(parent.id, parent.id).forEach((e: any) => usedIn.set(e.automation_id, e));
            conditionalStmt.all(parent.id).forEach((c: any) => usedIn.set(c.automation_id, c));

            const automations = [...usedIn.values()] as Automation[];
            if (!automations) return [];

            const camelAutomations = automations.map((a) => keysToCamelCase(a) as Automation);
            return camelAutomations;
        }
    },
    Query: {
        automation: validateInput(zodIdInputSchema, async (_parent, { id }: { id: number; }, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id, name, trigger, trigger_at, position, topic_id, trigger_key, trigger_value FROM automations WHERE id=?');
            const automation = stmt.get(id) as Automation;

            if (!automation) return null;

            return keysToCamelCase<Automation>(automation);
        }),
        automations: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id, name, trigger FROM automations');
            const automations = stmt.all() as Record<string, any>[];
            const camelAutomations = automations.map((a) => keysToCamelCase(a) as Automation);
            return camelAutomations;
        }),
        charts: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id, name, topic_id, key FROM charts');
            const charts = stmt.all() as Record<string, any>[];
            const camelCharts = charts.map((c) => keysToCamelCase(c) as Chart);
            return camelCharts;
        }),
        controls: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT id as device_id, topic_id, name, kind, set_key, state_key, value_on, value_off FROM devices WHERE kind IN (\'dimmable\', \'positionable\', \'toggleable\')');
            const controls = stmt.all() as Record<string, any>[];

            const camelControls = controls.map((c) => {
                const state: string = c.kind == 'toggleable' ? 'false' : '0';
                return keysToCamelCase({ ...c, state }) as Control;
            });
            return camelControls;
        }),
        device: validateInput(zodIdInputSchema, async (_parent, { id }: { id: number; }, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT * FROM devices WHERE id=?');
            const device = stmt.get(id) as Device;

            if (!device) return null;

            return keysToCamelCase<Device>(device);
        }),
        devices: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT * FROM devices');
            const devices = stmt.all() as Record<string, any>[];
            const camelDevices = devices.map((d) => keysToCamelCase(d) as Device);
            return camelDevices;
        }),
        favorites: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT name, topic_id, key as state_key FROM charts WHERE is_favorite=1');
            const favorites = stmt.all() as Record<string, any>[];
            const camelFavorites = favorites.map((f) => keysToCamelCase({ ...f, state: '0' }) as Favorite);
            return camelFavorites;
        }),
        topics: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            const stmt = context.db.prepare('SELECT * FROM topics');
            const topics = stmt.all() as Record<string, any>[];
            const camelTopics = topics.map((t) => keysToCamelCase(t) as Topic);
            return camelTopics;
        })
    },
    Mutation: {
        setDevice: validateInput(zodSetDeviceInputSchema, async (_parent, { input }: { input: SetDeviceInput; }, context: ApolloServerContext) => {
            console.info("setDevice", input);

            return true;
        }),
        signIn: validateInput(zodSignInInputSchema, async (_parent, { input }: { input: SignInInput; }, context: ApolloServerContext) => {
            const user = context.db.prepare('SELECT id, password, is_admin FROM users WHERE username=?').get(input.username) as User;
            if (!user) throw new GraphQLError(
                'Invalid username or password',
                { extensions: { code: 'BAD_USER_INPUT' } }
            );

            if (!verifyPassword(input.password, user.password)) throw new GraphQLError(
                'Invalid username or password',
                { extensions: { code: 'BAD_USER_INPUT' } }
            );

            const sessionId = randomBytes(32).toString('base64');
            const { changes } = context.db.prepare('UPDATE users SET session_id=?, session_created_at=DATETIME() WHERE id=?').run(sessionId, user.id);
            if (changes === 0) throw Error('A session creation error occurred');

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const session = await encrypt({ sessionId, expiresAt });
            const cookieStore = await cookies();
            cookieStore.set('session', session, {
                httpOnly: true,
                secure: true,
                expires: expiresAt,
                sameSite: 'lax',
                path: '/',
            });

            return true;
        }, { protected: false }),
        signOut: validateInput(zodEmptyInputSchema, async (_parent, _input, context: ApolloServerContext) => {
            if (!context.userId) {
                throw new Error('Not authenticated');
            }

            try {
                context.db.prepare('UPDATE users SET session_id=NULL, session_created_at=NULL WHERE id=?').run(context.userId);

                const cookieStore = await cookies();
                cookieStore.delete('session');

                return true;
            }
            catch (error) {
                console.error('Signout failed:', error);
                return false;
            }

        }),
        signUp: validateInput(zodSignUpInputSchema, async (_parent, { input }: { input: SignUpInput; }, context: ApolloServerContext) => {
            const secret: any = {};
            dotenv.config({ path: path.resolve(process.cwd(), 'secret.env'), processEnv: secret });
            if (input.authPhrase !== secret.AUTH_PHRASE) throw new GraphQLError(
                'The authorization phrase is invalid or disabled',
                { extensions: { code: 'BAD_USER_INPUT' } }
            );

            context.db.prepare('INSERT INTO USERS (username, password, name, is_admin) VALUES(?, ?, ?, ?) RETURNING *').run(input.username, hashPassword(input.password), input.name, input.isAdmin ? 1 : 0);
            return true;
        }, { protected: false }),
        upsertDevice: validateInput(zodUpsertDeviceSchema, async (_parent, { input }: { input: UpsertDeviceInput; }, context: ApolloServerContext) => {
            const { id } = input;

            const device = id > 0 ?
                context.db.prepare('UPDATE devices SET topic_id=?, name=?, kind=?, set_key=?, state_key=?, set_suffix=?, value_on=?, value_off=? WHERE id=? RETURNING *').get(input.topicId, input.name, input.kind, input.setKey, input.stateKey, input.setSuffix, input.valueOn, input.valueOff, id) as Device :
                context.db.prepare('INSERT INTO devices (topic_id, name, kind, set_key, state_key, set_suffix, value_on, value_off) VALUES(?, ?, ?, ?, ?, ?, ?, ?) RETURNING *').get(input.topicId, input.name, input.kind, input.setKey, input.stateKey, input.setSuffix, input.valueOn, input.valueOff) as Device;

            return keysToCamelCase(device);
        }),
        upsertTopic: validateInput(zodUpsertTopicInputSchema, async (_parent, { input }: { input: UpsertTopicInput; }, context: ApolloServerContext) => {
            const topic = context.db.prepare('INSERT INTO topics (topic) VALUES(?) ON CONFLICT(topic) DO UPDATE SET topic=topic RETURNING *').get(input.topic) as Topic;

            return keysToCamelCase(topic);
        })
    }
};

function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    // Generate a 64-byte derived key using scrypt
    const derivedKey = scryptSync(password, salt, 64);

    // Store both the salt and the hash separated by a colon
    return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');

    // Hash the incoming password with the same salt
    const derivedKey = scryptSync(password, salt, 64);

    // Use timingSafeEqual to prevent timing attacks
    return timingSafeEqual(keyBuffer, derivedKey);
}
