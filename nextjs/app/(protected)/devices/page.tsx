import { PreloadQuery } from '@/lib/apollo-server';
import DevicePills from "@/components/DevicePills";
import { GET_DEVICE_STUBS } from "@/lib/queries";
import { connection } from 'next/server';
import { ProtectedPage } from '@/components/ProtectedPage';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

async function PreloadedDevices() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_DEVICE_STUBS}>
      {(queryRef) => (
        // Pass the query reference down to the client component
        <DevicePills queryRef={queryRef} />
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
        Setup some devices
      </h1>
      <h3 className="text-2xl font-normal mb-6">Create one or many devices for various mqtt topics.</h3>
      <PreloadedDevices />
    </main>
  );
}

export default ProtectedPage(Home);