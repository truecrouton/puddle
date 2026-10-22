import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    // 1. Where your GraphQL schema lives (your running Next.js dev server)
    schema: './src/schema.graphql',

    // 3. Output directory for the generated types and helper functions
    generates: {
        './src/generated/gql/': {
            documents: ['../nextjs/lib/**/*.ts'],
            preset: 'client',
        },
        './src/generated/resolvers-types.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
        },
    },
};

export default config;