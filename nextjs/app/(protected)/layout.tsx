import "@/app/globals.css";
import type { Metadata } from "next";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import Footer from "@/components/Footer";
import { ReactNode } from "react";
import ProtectedNavBar from "@/components/ProtectedNavBar";

export const metadata: Metadata = {
  title: "Puddle",
  description: "Home automation server",
};

export default function ProtectedLayout({ children }: { children: ReactNode; }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <ApolloWrapper>
        <ProtectedNavBar />
        <main className="flex-1 p-6">
          {children}
        </main>
        <Footer />
      </ApolloWrapper>
    </div>
  );
}
