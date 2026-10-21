import { PreloadQuery } from '@/lib/apollo-server';
import ControlPills from "@/components/ControlPills";
import { GET_CONTROLS } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';

async function PreloadedDevices() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_CONTROLS}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <ControlPills queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

async function Home() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Control your devices</h1>
      <h3 className="text-2xl font-normal mb-6">Tap or click to control.</h3>
      <PreloadedDevices />
    </main>
  );
}

export default ProtectedPage(Home);