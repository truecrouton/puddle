import { PreloadQuery } from '@/lib/apollo-server';
import FavoritePills from "@/components/FavoritePills";
import { GET_FAVORITES } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';

async function PreloadedDevices() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_FAVORITES}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <FavoritePills queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

async function Home() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Home automation with mqtt</h1>
        <h3 className="text-2xl font-normal mb-6">A simple home control and automation runner for mqtt. Provides an API for custom frontends or use the included web interface. Runs on node.js.</h3>
      </div>
      <PreloadedDevices />
    </main>
  );
}

export default ProtectedPage(Home);