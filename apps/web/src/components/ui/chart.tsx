"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Datum {
  label: string;
  value: number;
}

/** Shared "view as table" disclosure, so no chart is the only way to read the numbers. */
function DataTable({ data, valueLabel, format }: { data: Datum[]; valueLabel: string; format: (n: number) => string }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-brand-text">View as table</summary>
      <table className="mt-2 w-full">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 font-medium">Label</th>
            <th className="py-2 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label} className="border-b border-line last:border-b-0">
              <td className="py-2">{d.label}</td>
              <td className="py-2 text-right tabular-nums">{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/**
 * Single-series column chart. One hue, thin rounded columns on a shared baseline,
 * recessive grid, a hover/focus tooltip per column, and only the latest value labelled.
 */
export function ColumnChart({
  data,
  valueLabel,
  format = String,
  height = 200,
  summary,
}: {
  data: Datum[];
  valueLabel: string;
  format?: (n: number) => string;
  height?: number;
  summary: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value));
  const top = Math.ceil(max / 20) * 20 || 1;
  const ticks = [0, top / 2, top];

  return (
    <figure>
      <div className="flex gap-3" role="img" aria-label={summary}>
        <div className="flex flex-col justify-between pb-6 text-right text-xs text-muted tabular-nums" style={{ height }} aria-hidden>
          {[...ticks].reverse().map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="h-px bg-line/70" />
            ))}
          </div>
          <ol className="relative flex items-end gap-[2px]" style={{ height: height - 24 }}>
            {data.map((d, i) => {
              const last = i === data.length - 1;
              return (
                <li key={d.label} className="relative flex h-full flex-1 items-end justify-center">
                  <button
                    type="button"
                    className="group relative flex h-full w-full cursor-default items-end justify-center focus-visible:outline-none"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    aria-label={`${d.label}: ${format(d.value)} ${valueLabel}`}
                  >
                    <span
                      className={cn(
                        "block w-full max-w-7 rounded-t-[4px] bg-chart-mark transition-opacity duration-150",
                        active !== null && active !== i && "opacity-40",
                        "group-focus-visible:ring-2 group-focus-visible:ring-fg",
                      )}
                      style={{ height: `${(d.value / top) * 100}%` }}
                    />
                    {(last || active === i) && (
                      <span
                        className={cn(
                          "pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-lg text-xs font-semibold whitespace-nowrap tabular-nums",
                          active === i ? "z-10 bg-fg px-2 py-1 text-bg shadow-pop" : "text-fg",
                        )}
                        style={{ bottom: `calc(${(d.value / top) * 100}% + 6px)` }}
                      >
                        {active === i ? `${d.label}: ${format(d.value)}` : format(d.value)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="h-px bg-muted/50" aria-hidden />
          <ol className="flex gap-[2px] pt-2 text-xs text-muted" aria-hidden>
            {data.map((d, i) => (
              <li key={d.label} className={cn("flex-1 truncate text-center", i % 2 === 1 && "max-sm:invisible")}>
                {d.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <DataTable data={data} valueLabel={valueLabel} format={format} />
    </figure>
  );
}

/** Single-series ranked bars, each labelled with its category and value as text. */
export function BarList({
  data,
  valueLabel,
  max = 100,
  format = String,
  summary,
}: {
  data: Datum[];
  valueLabel: string;
  max?: number;
  format?: (n: number) => string;
  summary: string;
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <figure>
      <ul className="flex flex-col gap-3" aria-label={summary}>
        {sorted.map((d) => (
          <li key={d.label} title={`${d.label}: ${format(d.value)} ${valueLabel}`}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{d.label}</span>
              <span className="font-semibold tabular-nums">{format(d.value)}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-chart-mark" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <DataTable data={sorted} valueLabel={valueLabel} format={format} />
    </figure>
  );
}
