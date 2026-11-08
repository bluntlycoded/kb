"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileView } from "@/components/app/profile-view";
import { Guard } from "@/components/shell/guard";

export function ColleagueProfile({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Guard feature="profile">
      <button
        type="button"
        onClick={() => router.back()}
        className="-ml-2 mb-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>
      <ProfileView personId={id} />
    </Guard>
  );
}
