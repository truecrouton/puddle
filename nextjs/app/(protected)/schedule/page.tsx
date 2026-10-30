import { PreloadQuery } from '@/lib/apollo-server';
import ScheduleTable from "@/components/ScheduleTable";
import { GET_SCHEDULE } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

async function PreloadedDevices() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_SCHEDULE}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <ScheduleTable queryRef={queryRef} />
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
        Today's scheduled automations
      </h1>
      <h3 className="text-2xl font-normal mb-6">Change the schedule under automations. </h3>
      <PreloadedDevices />
    </>
  );
}

export default ProtectedPage(Home);