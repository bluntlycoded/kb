"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageLoading } from "@/components/shell/loading";
import { useDemo } from "@/lib/demo/store";

export default function Root() {
  const { hydrated, state } = useDemo();
  const router = useRouter();
  useEffect(() => {
    if (!hydrated) return;
    const s = state.session;
    router.replace(!s ? "/login" : s.kind === "platform" ? "/console" : "/home");
  }, [hydrated, state.session, router]);
  return <FullPageLoading />;
}
