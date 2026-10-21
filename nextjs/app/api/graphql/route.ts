import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import globalDb from '@/lib/db';
import { decrypt } from '@/lib/session';
import Database from 'better-sqlite3';
import { typeDefs } from '@/lib/typeDefs';
import { resolvers } from '@/lib/resolvers';

export interface ApolloServerContext {
    userId: number;
    db: Database.Database;
}

// Initialize Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// Create the Next.js route handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
    context: async (req): Promise<ApolloServerContext> => {
        const sessionToken = req.cookies.get('session')?.value;
        const session = await decrypt(sessionToken);

        let user = null;
        if (session) {
            user = globalDb.prepare('SELECT id FROM users WHERE session_id=?').get(session.sessionId) as Record<string, number>;
        }

        // Resolver context
        return {
            userId: user ? user.id : 0,
            db: globalDb
        };
    },
});

// Export both GET and POST handlers for Next.js App Router
export { handler as GET, handler as POST };