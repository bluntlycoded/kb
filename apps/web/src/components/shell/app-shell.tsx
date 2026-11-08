"use client";

import type { PresenceStatus } from "@platform/shared";
import { Check, ChevronDown, Coins, LogOut, Menu as MenuIcon, RotateCcw, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar, presenceDot, presenceLabel } from "@/components/ui/avatar";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/menu";
import { useDemo } from "@/lib/demo/store";
import { checkAccess, MANAGE_NAV, ROLE_LABEL, WORKSPACE_NAV, type NavItem } from "@/lib/nav";
import { cn, formatNumber } from "@/lib/utils";
import { FullPageLoading } from "./loading";
import { Logo } from "./logo";

const SETTABLE: Exclude<PresenceStatus, "OFFLINE">[] = ["ACTIVE", "AWAY", "BUSY"];

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, me, platformUser } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const setDrawerOpen = (open: boolean) => setDrawerPath(open ? pathname : null);

  useEffect(() => {
    if (!hydrated || me) return;
    router.replace(platformUser ? "/console" : `/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, me, platformUser, router, pathname]);

  if (!hydrated || !me) return <FullPageLoading />;

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-xl bg-brand px-4 py-3 font-semibold text-brand-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface lg:flex">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 cursor-pointer bg-slate-950/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85%] animate-enter border-r border-line bg-surface">
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenNav={() => setDrawerOpen(true)} />
        <main id="main" tabIndex={-1} className="flex-1 px-4 pt-6 pb-16 outline-none sm:px-6 lg:px-10 lg:pt-8">
          <div key={me.id} className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { me, enabledModules, state } = useDemo();
  const pathname = usePathname();
  if (!me) return null;

  const visible = (items: NavItem[]) => items.filter((i) => checkAccess(i, me.role, enabledModules).ok);
  const manage = visible(MANAGE_NAV);

  return (
    <div className="flex w-full flex-col px-3 py-4">
      <div className="flex items-center justify-between px-2 pb-5">
        <Logo name={state.company.name} className="min-w-0 text-[15px]" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <NavGroup label="Workspace" items={visible(WORKSPACE_NAV)} pathname={pathname} />
        {manage.length > 0 && <NavGroup label="Manage" items={manage} pathname={pathname} />}
      </nav>

      <div className="mt-4 rounded-2xl bg-surface-2 p-3.5">
        <p className="text-xs font-semibold text-muted">Signed in as</p>
        <p className="mt-0.5 text-sm font-semibold">{ROLE_LABEL[me.role]}</p>
        <p className="mt-1 text-xs text-muted">Demo workspace · data resets anytime</p>
      </div>
    </div>
  );
}

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition duration-150",
                  active ? "bg-brand-soft text-brand-text" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const { me, setStatus, signOut, resetDemo, state } = useDemo();
  const router = useRouter();
  if (!me) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur sm:px-6 lg:px-10">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl hover:bg-surface-2 lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>
      <Logo name={state.company.name} className="min-w-0 text-[15px] lg:hidden" />

      <form
        role="search"
        className="relative ml-4 hidden max-w-sm flex-1 md:block"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
          router.push(`/directory${q ? `?q=${encodeURIComponent(q)}` : ""}`);
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          name="q"
          type="search"
          aria-label="Search people"
          placeholder="Search people, roles, skills"
          className="h-10 w-full rounded-xl border border-line bg-surface-2 pr-3 pl-10 text-sm focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand-soft focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link
          href="/profile"
          className="hidden min-h-11 items-center gap-2 rounded-xl bg-points-soft px-3 text-sm font-bold text-points tabular-nums sm:inline-flex"
          aria-label={`${me.points} points. View your profile`}
        >
          <Coins className="size-4" aria-hidden />
          {formatNumber(me.points)} pts
        </Link>

        <Menu
          label="Account and status"
          trigger={
            <span className="flex items-center gap-2.5">
              <Avatar name={me.name} size="sm" status={me.status} />
              <span className="hidden text-left md:block">
                <span className="block text-sm leading-tight font-semibold">{me.name}</span>
                <span className="block text-xs text-muted">{presenceLabel[me.status]}</span>
              </span>
              <ChevronDown className="hidden size-4 text-muted md:block" aria-hidden />
            </span>
          }
        >
          {(close) => (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Set your status</p>
              {SETTABLE.map((s) => (
                <MenuItem
                  key={s}
                  selected={me.status === s}
                  onClick={() => {
                    setStatus(s);
                    close();
                  }}
                >
                  <span className={cn("size-2.5 rounded-full", presenceDot[s])} aria-hidden />
                  {presenceLabel[s]}
                  {me.status === s && <Check className="ml-auto text-brand-text" aria-hidden />}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem
                onClick={() => {
                  close();
                  router.push("/profile");
                }}
              >
                <UserRound aria-hidden /> My profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  close();
                  resetDemo();
                }}
              >
                <RotateCcw aria-hidden /> Reset demo data
              </MenuItem>
              <MenuDivider />
              <MenuItem
                danger
                onClick={() => {
                  close();
                  signOut();
                }}
              >
                <LogOut aria-hidden /> Sign out
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
