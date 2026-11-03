import { ApolloServer } from "@apollo/server";
import fastifyApollo, { ApolloFastifyContextFunction, fastifyApolloDrainPlugin } from "@as-integrations/fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { typeDefs } from "puddle-graphql/server";
import { resolvers } from "./resolvers";
import Database from "better-sqlite3";
import { MqttClient } from "mqtt";
import { decrypt } from "./session";
import { mqttClient } from "../mqtt";

export interface ApolloServerContext {
    userId: number;
    db: Database.Database;
    mqtt: MqttClient;
    request: FastifyRequest,
    reply: FastifyReply;
}

export const initFastify = async (db: Database.Database) => {
    const fastify = await Fastify();

    const apollo = new ApolloServer<ApolloServerContext>({
        typeDefs,
        resolvers,
        plugins: [fastifyApolloDrainPlugin(fastify)],
    });

    await apollo.start();

    await fastify.register(rateLimit);
    await fastify.register(helmet);
    await fastify.register(cors);
    await fastify.register(compress);
    await fastify.register(cookie);

    const apolloContextFunction: ApolloFastifyContextFunction<ApolloServerContext> = async (request, reply): Promise<ApolloServerContext> => {

        const sessionToken = request.cookies.session;
        const session = await decrypt(sessionToken);

        let user = null;
        if (session) {
            user = db.prepare('SELECT id FROM users WHERE session_id=?').get(session.sessionId) as Record<string, number>;
        }

        // Resolver context
        return {
            userId: user ? user.id : 0,
            db,
            mqtt: mqttClient,
            request,
            reply
        };
    };

    await fastify.register(fastifyApollo(apollo), {
        path: '/api/graphql',
        context: apolloContextFunction,
    });

    await fastify.listen({
        host: '127.0.0.1',
        port: 3030,
    });

    return fastify;
}

