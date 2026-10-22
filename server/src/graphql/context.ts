import { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import Database from "better-sqlite3";
import { db as globalDb } from "../storage";
import { decrypt } from "./session";
import { FastifyReply, FastifyRequest } from "fastify";

export interface ApolloServerContext {
    userId: number;
    db: Database.Database;
    request: FastifyRequest,
    reply: FastifyReply;
}

export const apolloContextFunction: ApolloFastifyContextFunction<ApolloServerContext> = async (request, reply): Promise<ApolloServerContext> => {
    const sessionToken = request.cookies.session;
    const session = await decrypt(sessionToken);

    let user = null;
    if (session) {
        user = globalDb.prepare('SELECT id FROM users WHERE session_id=?').get(session.sessionId) as Record<string, number>;
    }

    // Resolver context
    return {
        userId: user ? user.id : 0,
        db: globalDb,
        request,
        reply
    };
};