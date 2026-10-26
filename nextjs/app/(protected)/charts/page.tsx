import { PreloadQuery } from '@/lib/apollo-server';
import ChartPills from "@/components/ChartPills";
import { GET_CHARTS } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

async function PreloadedCharts() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_CHARTS}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <ChartPills queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

async function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
        <Link className="btn btn-primary btn-sm btn-circle mr-3" href='/dashboard'>
          <ArrowUp className='h-6 w-6' />
        </Link>
        Review mqtt topic states
      </h1>
      <PreloadedCharts />
    </main>
  );
}

export default ProtectedPage(Home);