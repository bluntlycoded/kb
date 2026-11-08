"use client";

import { Building, Layers, LogOut, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/menu";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { FullPageLoading } from "./loading";

const NAV = [
  { href: "/console", label: "Customers", icon: Building },
  { href: "/console/cohorts", label: "Cohorts", icon: Sparkles },
  { href: "/console/plans", label: "Plans", icon: Layers },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const { hydrated, platformUser, me, signOut, resetDemo } = useDemo();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !platformUser) router.replace(me ? "/home" : "/login");
  }, [hydrated, platformUser, me, router]);

  if (!hydrated || !platformUser) return <FullPageLoading />;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="inline-flex items-center gap-2.5 font-bold">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-fg text-bg">
              <Layers className="size-5" aria-hidden />
            </span>
            <span className="hidden sm:inline">Engage Console</span>
          </span>
          <Badge tone="brand" className="hidden sm:inline-flex">
            {platformUser.role === "CORE_ADMIN" ? "Platform team" : "Reseller"}
          </Badge>
          <nav aria-label="Console" className="ml-2 flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/console" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold",
                    active ? "bg-brand-soft text-brand-text" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto">
            <Menu
              label="Account"
              trigger={
                <span className="flex items-center gap-2">
                  <Avatar name={platformUser.name} size="sm" />
                  <span className="hidden text-sm font-semibold md:block">{platformUser.name}</span>
                </span>
              }
            >
              {(close) => (
                <>
                  <p className="px-3 pt-2 pb-1 text-xs text-muted">{platformUser.email}</p>
                  <MenuItem
                    onClick={() => {
                      close();
                      resetDemo();
                    }}
                  >
                    <RotateCcw aria-hidden /> Reset demo data
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem danger onClick={signOut}>
                    <LogOut aria-hidden /> Sign out
                  </MenuItem>
                </>
              )}
            </Menu>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
