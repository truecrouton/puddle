import { PreloadQuery } from '@/lib/apollo-server';
import FavoritePills from "@/components/FavoritePills";
import { GET_FAVORITES } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import { MousePointer2 } from 'lucide-react';

async function PreloadedFavorites() {
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
    <main className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Home automation with mqtt</h1>
        <h3 className="text-2xl font-normal mb-6">A simple home control and automation runner for mqtt. Provides an API for custom frontends or use the included web interface. Runs on node.js.</h3>
      </div>
      <PreloadedFavorites />
      <div className="flex flex-wrap gap-3">
        <MousePointer2 className="w-12 h-12" />
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/control'>
          <div className="text-left">
            <h3 className="font-bold">Control</h3>
          </div>
        </a>
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/devices'>
          <div className="text-left">
            <h3 className="font-bold">Devices</h3>
          </div>
        </a>
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/automations'>
          <div className="text-left">
            <h3 className="font-bold">Automations</h3>
          </div>
        </a>
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/topics'>
          <div className="text-left">
            <h3 className="font-bold">Topics</h3>
          </div>
        </a>
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/schedule'>
          <div className="text-left">
            <h3 className="font-bold">Schedule</h3>
          </div>
        </a>
        <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/charts'>
          <div className="text-left">
            <h3 className="font-bold">Charts</h3>
          </div>
        </a>
      </div>
    </main>
  );
}

export default ProtectedPage(Home);