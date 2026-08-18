"use client";

import { CapsuleDashboard } from "@/components/CapsuleDashboard";
import { LandingPage } from "@/components/LandingPage";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-sm text-stone-400">
        확인 중...
      </main>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <CapsuleDashboard />;
}
