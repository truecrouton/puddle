import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';

export function ProtectedPage<P extends object>(Page: ComponentType<P>) {
    return async function WrappedPage(props: P) {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session');

        const session = await decrypt(sessionToken?.value);
        if (!session?.sessionId || !session?.expiresAt) redirect('/');

        return <Page {...props} />;
    };
}