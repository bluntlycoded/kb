import { Suspense } from "react";
import { ConsoleShell } from "@/components/shell/console-shell";
import { FullPageLoading } from "@/components/shell/loading";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <ConsoleShell>{children}</ConsoleShell>
    </Suspense>
  );
}
