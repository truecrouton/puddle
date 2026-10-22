import { PreloadQuery } from '@/lib/apollo-server';
import ScheduleTable from "@/components/ScheduleTable";
import { GET_SCHEDULE } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';

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
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Today's scheduled automations</h1>
      <h3 className="text-2xl font-normal mb-6">Change the schedule under automations. </h3>
      <PreloadedDevices />
    </main>
  );
}

export default ProtectedPage(Home);