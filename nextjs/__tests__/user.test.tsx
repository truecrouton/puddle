import { SIGN_UP, SIGN_IN } from '@/lib/queries';
import { test, expect } from '@/__tests__/utils/fixtures';
import { createUserFactory } from './utils/factories';

test('signs up and signs in a user', async ({ client }) => {
    const user = createUserFactory();
    const userRes = await client.mutate({
        mutation: SIGN_UP,
        variables: {
            input: {
                username: user.username,
                password: user.password,
                name: user.name,
                isAdmin: user.isAdmin,
                authPhrase: 'change_this_before_use'
            }
        }
    });
    expect(userRes.data).toBeTruthy();
    expect(userRes.data?.signUp).toEqual(true);

    const signInRes = await client.mutate({
        mutation: SIGN_IN,
        variables: {
            input: {
                username: user.username,
                password: user.password,
            }
        }
    });
    expect(signInRes.data).toBeTruthy();
    expect(signInRes.data?.signIn).toEqual(true);
});

test('expect signUp toThrow', async ({ client }) => {
    const user = createUserFactory();
    await expect(client.mutate({
        mutation: SIGN_UP,
        variables: {
            input: {
                username: user.username,
                password: user.password,
                name: user.name,
                isAdmin: user.isAdmin,
                authPhrase: 'wrong_auth_phrase'
            }
        }
    })).rejects.toThrow('The authorization phrase is invalid or disabled');
});