import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    // 1. Where your GraphQL schema lives (your running Next.js dev server)
    schema: 'http://localhost:3000/api/graphql',

    // 3. Output directory for the generated types and helper functions
    generates: {
        './generated/gql/': {
            documents: ['lib/**/*.ts'],
            preset: 'client',
        },
        './generated/resolvers-types.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
        },
        './generated/zod-schemas.ts': {
            plugins: [
                'typescript-validation-schema'
            ],
            config: {
                schema: 'zod', // Tells it to generate Zod validators
                strictScalars: true,
                importFrom: '@/generated/resolvers-types',
                validationSchemaExportType: 'const'
            },
        }
    },
};

export default config;