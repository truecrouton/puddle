import { ApolloServer } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin } from "@as-integrations/fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { ApolloServerContext, apolloContextFunction } from './context';
import { typeDefs } from "puddle-graphql/server";
import { resolvers } from "./resolvers";

export const initFastify = async () => {
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

    await fastify.register(fastifyApollo(apollo), {
        path: '/api/graphql',
        context: apolloContextFunction,
    });

    await fastify.listen({
        port: 3030,
    });

    return fastify;
}

