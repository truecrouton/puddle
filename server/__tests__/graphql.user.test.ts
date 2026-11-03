import { SIGN_UP, SIGN_IN } from './utils/queries';
import { test, expect, beforeAll } from './utils/fixtures';
import { createUserFactory } from './utils/factories';
import { storageInit } from '../src/storage';

beforeAll(async () => {
    storageInit('__tests__/puddle_test.sqlite');
});

test('signs up and signs in a user', async ({ executeOperation }) => {
    const user = createUserFactory();
    const userRes = await executeOperation(SIGN_UP, {
        input: {
            username: user.username,
            password: user.password,
            name: user.name,
            isAdmin: user.isAdmin,
            authPhrase: 'change_this_before_use'
        }

    });
    expect(userRes.signUp).toEqual(true);

    const signInRes = await executeOperation(SIGN_IN, {
        input: {
            username: user.username,
            password: user.password,
        }
    });
    expect(signInRes.signIn).toEqual(true);
});

test('expect signUp toThrow', async ({ executeOperation }) => {
    const user = createUserFactory();
    await expect(executeOperation(SIGN_UP, {
        input: {
            username: user.username,
            password: user.password,
            name: user.name,
            isAdmin: user.isAdmin,
            authPhrase: 'wrong_auth_phrase'
        }
    })).rejects.toThrow('The authorization phrase is invalid or disabled');
});