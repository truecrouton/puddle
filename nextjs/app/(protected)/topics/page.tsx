import { PreloadQuery } from '@/lib/apollo-server';
import TopicsTable from "@/components/TopicsTable";
import { GET_TOPIC_DETAILS } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

async function PreloadedDevices() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_TOPIC_DETAILS}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <TopicsTable queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

async function Home() {
  return (
    <>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
        <Link className="btn btn-primary btn-sm btn-circle mr-3" href='/dashboard'>
          <ArrowUp className='h-6 w-6' />
        </Link>
        Peruse your mqtt topics
      </h1>
      <PreloadedDevices />
    </>
  );
}

export default ProtectedPage(Home);