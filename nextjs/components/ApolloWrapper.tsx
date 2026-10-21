"use client";

import { ReactNode } from "react";
import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { HttpLink } from "@apollo/client";

export function ApolloWrapper({ children }: { children: ReactNode; }) {
    function makeClient() {
        const httpLink = new HttpLink({
            uri: 'http://localhost:3000/api/graphql',
            credentials: 'include', // Used in the browser after hydration
        });

        return new ApolloClient({
            link: httpLink,
            cache: new InMemoryCache
        });
    };

    return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
} 