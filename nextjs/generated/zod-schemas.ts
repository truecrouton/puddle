import { z } from 'zod'
import { UpsertTopicInput, UpsertDeviceInput, SignUpInput, SignInInput, SetDeviceInput } from '@/generated/resolvers-types'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const UpsertTopicInputSchema: z.ZodObject<Properties<UpsertTopicInput>> = z.object({
    id: z.number(),
    topic: z.string()
});

export const UpsertDeviceInputSchema: z.ZodObject<Properties<UpsertDeviceInput>> = z.object({
    id: z.number(),
    kind: z.string(),
    name: z.string(),
    setKey: z.string().nullish(),
    setSuffix: z.string().nullish(),
    stateKey: z.string().nullish(),
    topicId: z.number(),
    valueOff: z.string().nullish(),
    valueOn: z.string().nullish()
});

export const SignUpInputSchema: z.ZodObject<Properties<SignUpInput>> = z.object({
    authPhrase: z.string(),
    isAdmin: z.boolean(),
    name: z.string(),
    password: z.string(),
    username: z.string()
});

export const SignInInputSchema: z.ZodObject<Properties<SignInInput>> = z.object({
    password: z.string(),
    username: z.string()
});

export const SetDeviceInputSchema: z.ZodObject<Properties<SetDeviceInput>> = z.object({
    deviceId: z.number(),
    state: z.string()
});
