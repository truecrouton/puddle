"use client";

import { ReactNode } from "react";
import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { HttpLink } from "@apollo/client";

export function ApolloWrapper({ children }: { children: ReactNode; }) {
    function makeClient() {
        const httpLink = new HttpLink({
            uri: 'http://localhost:3030/api/graphql',
            credentials: 'include', // Used in the browser after hydration
        });

        const cache = new InMemoryCache({
            typePolicies: {
                Query: {
                    fields: {
                        automations: {
                            // Tell Apollo how to merge existing and incoming automation lists
                            merge(existing, incoming) {
                                return incoming;
                            },
                        },
                    },
                },
            },
        });

        return new ApolloClient({
            link: httpLink,
            cache: cache
        });
    };

    return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
} 