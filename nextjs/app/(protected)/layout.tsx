import type { Metadata } from "next";
import "@/app/globals.css";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import Footer from "@/components/Footer";
import { ReactNode } from "react";
import { UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Puddle",
  description: "Home automation server",
};

export default function ProtectedLayout({ children }: { children: ReactNode; }) {
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
            <a className="btn btn-ghost text-xl" href="/dashboard">Puddle</a>
          </div>
          <div className="navbar-end hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><a href="/control">Control</a></li>
              <li><a href="/devices">Devices</a></li>
              <li><a href="/automations">Automations</a></li>
              <li><a href="/topics">Topics</a></li>
              <li><a href="/schedule">Schedule</a></li>
              <li><a href="/charts">Charts</a></li>
              <li>
                <details>
                  <summary><UserRound /></summary>
                  <ul className="p-2 bg-base-100 w-40 z-1 right-0 left-auto">
                    <li><button>Add User</button></li>
                    <li><button>Sign Out</button></li>
                  </ul>
                </details>
              </li>

            </ul>
          </div>
        </div>

        <div className="collapse-content lg:hidden z-1">
          <ul className="menu">
            <li><button>Item c1</button></li>
            <li>
              <button>Parent</button>
              <ul>
                <li><button>Submenu c1</button></li>
                <li><button>Submenu c2</button></li>
              </ul>
            </li>
            <li><button>Item c3</button></li>
          </ul>
        </div>
      </div>
      <main className="flex-1 p-6">
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
      </main>
      <Footer />
    </div>
  );
}
