import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { FullPageLoading } from "@/components/shell/loading";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
