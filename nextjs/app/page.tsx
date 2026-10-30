import { ApolloWrapper } from "@/components/ApolloWrapper";
import SignInForm from "@/components/SignInForm";
import { UserPlus } from "lucide-react";
import { PreloadQuery } from '@/lib/apollo-server';
import { connection } from 'next/server';
import { GET_FAVORITES } from "@/lib/queries";
import FavoritePills from "@/components/FavoritePills";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";

async function PreloadedFavorites() {
  // Tells Next.js this segment runs at request-time (compatible with cacheComponents)
  await connection();

  return (
    <PreloadQuery query={GET_FAVORITES}>
      {(queryRef) => (
        <FavoritePills queryRef={queryRef} />
      )}
    </PreloadQuery>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <div className="max-lg:collapse bg-base-200 lg:mb-8 shadow-sm w-full rounded-md sticky top-0 z-50">
        <input id="navbar-1-toggle" className="peer hidden" type="checkbox" />
        <label htmlFor="navbar-1-toggle" className="fixed inset-0 hidden max-lg:peer-checked:block"></label>
        <div className="collapse-title navbar">
          <div className="navbar-start">
            <label htmlFor="navbar-1-toggle" className="btn btn-ghost lg:hidden">
              <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </label>
            <Link className="btn btn-ghost" href="/"><Logo className="h-6" /></Link>
          </div>
          <div className="navbar-end hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><button><UserPlus /></button></li>
            </ul>
          </div>
        </div>

        <div className="collapse-content lg:hidden z-1">
          <ul className="menu">
            <li><button><UserPlus /></button></li>
          </ul>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto p-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Home automation with mqtt</h1>
        <h3 className="text-2xl font-normal mb-6">A simple home control and automation runner for mqtt. Provides an API for custom frontends or use the included web interface. Runs on node.js.</h3>
        <ApolloWrapper>
          <PreloadedFavorites />
          <SignInForm />
        </ApolloWrapper>
      </main>

      <Footer />
    </div>
  );
}