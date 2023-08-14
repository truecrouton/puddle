'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { Server } from '@hapi/hapi';
import { storageInit, storeMessage } from "../src/storage";
import { randAccessory, randFullName, randUserName, randVerb, randWord } from '@ngneat/falso';

const lab = Lab.script();
const { afterEach, before, beforeEach, experiment, it, test } = lab;
export { lab };

experiment('setup users', () => {
    let server: Server;

    before((async () => {
        storageInit({ fileMustExist: true });
    }));

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    test('setup and login a user', async () => {
        const user = {
            username: randUserName(),
            password: 'Passw0rd!',
            is_admin: true,
            auth_phrase: 'changethislater',
            name: randFullName()
        };

        const res = await server.inject({
            method: 'post',
            url: '/api/user/setup',
            payload: user,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();

        const loginRes = await server.inject({
            method: 'post',
            url: '/api/user/login',
            payload: {
                username: user.username,
                password: user.password
            },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(loginRes.statusCode).to.equal(200);

        const logoutRes = await server.inject({
            method: 'post',
            url: '/api/user/logout',
            payload: {},
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(logoutRes.statusCode).to.equal(200);
    });

    test('update a password', async () => {
        const authPhrase = 'changethislater';
        const user = {
            username: randUserName(),
            password: 'Passw0rd!',
            is_admin: true,
            auth_phrase: authPhrase,
            name: randFullName()
        };

        const res = await server.inject({
            method: 'post',
            url: '/api/user/setup',
            payload: user,
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(res.statusCode).to.equal(200);

        const { result }: { result: any; } = res;
        expect(result).to.be.object();

        const newPassword = 'new_password';
        const updateRes = await server.inject({
            method: 'post',
            url: '/api/password/reset',
            payload: {
                username: user.username,
                new_password: newPassword,
                auth_phrase: authPhrase
            },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(updateRes.statusCode).to.equal(200);

        const loginRes = await server.inject({
            method: 'post',
            url: '/api/user/login',
            payload: {
                username: user.username,
                password: newPassword
            },
            auth: {
                strategy: 'session',
                credentials: {}
            }
        });
        expect(loginRes.statusCode).to.equal(200);
    });
});