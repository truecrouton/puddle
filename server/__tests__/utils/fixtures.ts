// src/utils/test.ts
import { test as base, expect, beforeAll, afterAll } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { resolvers } from '../../src/graphql/resolvers';
import knex from 'knex';
import path from 'path';
import { ApolloClient, HttpLink, InMemoryCache, TypedDocumentNode } from '@apollo/client';
import { typeDefs } from 'puddle-graphql/server';
import { storageInit } from '../../src/storage';

async function createTestDatabase() {
    const dbFile = path.resolve(process.cwd(), '__tests__/puddle_test.sqlite');
    const migrator = knex({
        client: 'better-sqlite3',
        connection: {
            filename: dbFile,
        },
        useNullAsDefault: true, // Required for SQLite
        migrations: {
            directory: path.resolve(process.cwd(), '../server/data/migrations'),
        },
    });

    await migrator.migrate.latest();

    return storageInit(dbFile);
}
function createApolloServer() {
    return new ApolloServer({
        typeDefs,
        resolvers,
    });
}

type TestFixtures = {
    db: any;
    executeOperation: <TResult, TVariables>(
        query: TypedDocumentNode<TResult, TVariables>,
        variables?: TVariables
    ) => Promise<any>;
    client: ApolloClient;
};

export const test = base.extend<TestFixtures>({
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
                    contextValue: { db, userId: 1, reply: { setCookie: () => { } } },
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
            link: new HttpLink({ uri: 'http://localhost:3030/api/graphql' }),
            cache: new InMemoryCache(),
        });

        await use(client);
    }
});

// Re-export expect so you only need to import from your custom test file
export { expect, beforeAll, afterAll };