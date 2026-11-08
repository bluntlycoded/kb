"use client";

import type { Feature, Permission } from "@platform/shared";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useDemo } from "@/lib/demo/store";
import { checkAccess, FEATURE_LABEL } from "@/lib/nav";

/** Shows the page only if the user's role and the company's plan allow it, and explains why not. */
export function Guard({ feature, permission, children }: { feature?: Feature; permission?: Permission; children: ReactNode }) {
  const { me, enabledModules } = useDemo();
  if (!me) return null;
  const access = checkAccess({ feature, permission }, me.role, enabledModules);
  if (access.ok) return <>{children}</>;
  return (
    <EmptyState
      icon={Lock}
      className="mt-16"
      title={access.reason === "module" ? `${FEATURE_LABEL[feature!]} is turned off` : "You don't have access to this page"}
      description={
        access.reason === "module"
          ? "Your company admin has turned this module off, or it isn't part of your company's plan."
          : "This area is for managers, HR or company admins. Ask your admin if you need access."
      }
      action={<ButtonLink href="/home" variant="secondary">Back to home</ButtonLink>}
    />
  );
}
