import Hapi from "@hapi/hapi";
import { Request, Server } from "@hapi/hapi";
import { routes } from './routes';
import { validateSession } from "./storage";

export let server: Server;

export const init = async function (): Promise<Server> {
    server = Hapi.server({
        port: process.env.PUDDLE_PORT || 4000,
        host: '0.0.0.0'
    });

    await server.register([
        require('@hapi/inert'),
        require('@hapi/cookie')
    ]);

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'pdl-sid',
            password: 'andthenitWentOverThereOk?ifNotOkToo.',
            path: '/',
            isSecure: false
        },
        validate: async (request: Request, session: any) => {
            const validation = validateSession(session.session_id);
            return validation ? { isValid: true, credentials: { userId: validation.userId, isAdmin: validation.isAdmin } } : { isValid: false };
        }
    });

    server.auth.default('session');

    server.route(routes);

    return server;
};

export const start = async function (): Promise<void> {
    console.log(`Listening on ${server.settings.host}:${server.settings.port}`);
    return server.start();
};

process.on('unhandledRejection', (err) => {
    console.error("unhandledRejection");
    console.error(err);
    process.exit(1);
});
