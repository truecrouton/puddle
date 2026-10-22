import { HttpLink, } from "@apollo/client";
import { registerApolloClient, InMemoryCache, ApolloClient } from "@apollo/client-integration-nextjs";
import { cookies } from 'next/headers';

export const { getClient, query, PreloadQuery } = registerApolloClient(async () => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session');

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({
            // Must use an absolute URL when fetching your own API route on the server
            uri: 'http://localhost:3030/api/graphql',
            headers: {
                cookie: sessionToken ? `session=${sessionToken.value}` : '',
            },
        }),
    });
});