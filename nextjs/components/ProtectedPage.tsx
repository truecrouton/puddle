import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { ComponentType } from 'react';

export function ProtectedPage<P extends object>(Page: ComponentType<P>) {
    return async function WrappedPage(props: P) {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session');

        const session = await decrypt(sessionToken?.value);
        if (!session) redirect('/');

        const user = db.prepare('SELECT 1 FROM users WHERE session_id=?').get(session.sessionId) as Record<string, number>;
        if (!user) redirect('/');

        return <Page {...props} />;
    };
}