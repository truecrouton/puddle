import { PreloadQuery } from '@/lib/apollo-server';
import AutomationList from "@/components/AutomationList";
import { GET_AUTOMATION } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

interface PreloadedAutomationProps {
  id: number;
}

async function PreloadedAutomation({ id }: PreloadedAutomationProps) {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_AUTOMATION} variables={{ id: Number(id) }}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <AutomationList queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

interface PageProps {
  params: Promise<{
    id: number;
  }>;
}

async function Home({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
        <Link className="btn btn-primary btn-sm btn-circle mr-3" href='/automations'>
          <ArrowUp className='h-6 w-6' />
        </Link>
        Setup this automation
      </h1>
      <PreloadedAutomation id={id} />
    </main>
  );
}

export default ProtectedPage(Home);