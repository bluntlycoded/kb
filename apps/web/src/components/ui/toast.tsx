"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "info";
  action?: { label: string; onClick: () => void };
}

type Push = (t: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }) => void;

const ToastContext = createContext<Push>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback<Push>(
    (t) => {
      const id = nextId++;
      setToasts((all) => [...all.slice(-2), { tone: "success", ...t, id }]);
      setTimeout(() => dismiss(id), t.action ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : Info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm animate-enter items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-pop"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" ? "text-success" : "text-brand-text")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 cursor-pointer text-sm font-semibold text-brand-text hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="-m-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-2"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
