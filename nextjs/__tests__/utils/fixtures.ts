// src/utils/test.ts
import { test as base, expect, beforeAll, afterAll } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/lib/typeDefs';
import { resolvers } from '@/lib/resolvers';
import knex from 'knex';
import path from 'path';
import { ApolloClient, HttpLink, InMemoryCache, TypedDocumentNode } from '@apollo/client';
import Database from 'better-sqlite3';

async function createTestDatabase() {
    // 1. Initialize Knex with an isolated in-memory SQLite database
    let db: Database.Database | undefined;

    const migrator = knex({
        client: 'better-sqlite3',
        connection: {
            filename: path.resolve(process.cwd(), '__tests__/test-db.sqlite'),
        },
        pool: {
            // Capture the raw better-sqlite3 instance when the pool creates it
            afterCreate: (conn: Database.Database, done: Function) => {
                db = conn;
                done(null, conn);
            },
        },
        useNullAsDefault: true, // Required for SQLite
        migrations: {
            // Point this to your actual project migrations folder
            directory: path.resolve(process.cwd(), '../server/data/migrations'),
        },
    });

    // 2. Run all migrations so your tables exist
    await migrator.migrate.latest();

    return db;
}
function createApolloServer() {
    return new ApolloServer({
        typeDefs,
        resolvers,
    });
}

// Define the types for your custom fixtures
type TestFixtures = {
    db: any;
    executeOperation: <TResult, TVariables>(
        query: TypedDocumentNode<TResult, TVariables>,
        variables?: TVariables
    ) => Promise<any>;
    client: ApolloClient;
};

export const test = base.extend<TestFixtures>({
    // 1. Define the 'db' fixture (spins up per test)
    db: async ({ }, use) => {
        const db = await createTestDatabase();

        // Pass the database instance to the test
        await use(db);

        // Teardown / cleanup after the test finishes (if needed)
        //await db?.destroy?.();
    },

    // 2. Define an 'execute' fixture that auto-binds the server and db to context
    executeOperation: async ({ db }, use) => {
        const server = createApolloServer();
        await server.start();

        // A clean helper function for tests to call
        const runOperation = async <TResult, TVariables>(
            query: TypedDocumentNode<TResult, TVariables>,
            variables?: TVariables
        ) => {
            const response = await server.executeOperation(
                {
                    query,
                    variables: variables as Record<string, any>
                },
                {
                    contextValue: { db, userId: 1 },
                }
            );

            // Fail fast if it's not a single response
            if (response.body.kind !== 'single') {
                throw new Error(`Expected single GraphQL response, got ${response.body.kind}`);
            }

            // Fail fast if there are GraphQL execution/validation errors
            if (response.body.singleResult.errors) {
                throw new Error(
                    `GraphQL Error in test:\n${JSON.stringify(response.body.singleResult.errors, null, 2)}`
                );
            }

            // Return just the typed data directly!
            return response.body.singleResult.data as TResult;
        };

        await use(runOperation);
    },
    client: async ({ }, use) => {
        const client = new ApolloClient({
            link: new HttpLink({ uri: 'http://localhost:3000/api/graphql' }),
            cache: new InMemoryCache(),
        });

        await use(client);
    }
});

// Re-export expect so you only need to import from your custom test file
export { expect, beforeAll, afterAll };