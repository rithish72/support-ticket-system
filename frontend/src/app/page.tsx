"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { PageLoader } from "@/components/ui";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? homeFor(user.role) : "/login");
  }, [loading, user, router]);

  return <PageLoader />;
}
