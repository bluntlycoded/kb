"use client";

import { ArrowLeft, Coins, Eraser, RotateCcw, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Guard } from "@/components/shell/guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

type Level = "easy" | "medium" | "hard";
const GIVENS: Record<Level, number> = { easy: 40, medium: 32, hard: 26 };
const POINTS: Record<Level, number> = { easy: 10, medium: 20, hard: 30 };

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

function fits(g: number[], i: number, n: number) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n || g[k * 9 + c] === n) return false;
    if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === n) return false;
  }
  return true;
}

/** Fill a grid by backtracking with shuffled digits: a random solved board. */
function fill(g: number[]): boolean {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (fits(g, i, n)) {
      g[i] = n;
      if (fill(g)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function newPuzzle(level: Level) {
  const solved = Array(81).fill(0);
  fill(solved);
  const keep = new Set(shuffle([...Array(81).keys()]).slice(0, GIVENS[level]));
  return solved.map((n, i) => (keep.has(i) ? n : 0));
}

/** Cells whose value repeats in their row, column or box. */
function conflicts(g: number[]) {
  const bad = new Set<number>();
  g.forEach((n, i) => {
    if (!n) return;
    const r = Math.floor(i / 9);
    const c = i % 9;
    for (let j = 0; j < 81; j++) {
      if (j === i || g[j] !== n) continue;
      const r2 = Math.floor(j / 9);
      const c2 = j % 9;
      if (r === r2 || c === c2 || (Math.floor(r / 3) === Math.floor(r2 / 3) && Math.floor(c / 3) === Math.floor(c2 / 3))) bad.add(i);
    }
  });
  return bad;
}

export default function SudokuPage() {
  return (
    <Guard feature="games">
      <Sudoku />
    </Guard>
  );
}

function Sudoku() {
  const { awardPoints } = useDemo();
  const [level, setLevel] = useState<Level>("easy");
  const [puzzle, setPuzzle] = useState(() => newPuzzle("easy"));
  const [grid, setGrid] = useState(puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);

  const bad = useMemo(() => conflicts(grid), [grid]);
  const filled = grid.filter(Boolean).length;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done, puzzle]);

  function start(l: Level) {
    const p = newPuzzle(l);
    setLevel(l);
    setPuzzle(p);
    setGrid(p);
    setSelected(null);
    setSeconds(0);
    setDone(false);
  }

  function put(n: number) {
    if (selected === null || puzzle[selected] || done) return;
    const next = grid.map((v, i) => (i === selected ? n : v));
    setGrid(next);
    // Solved = every cell filled with no conflicts.
    if (next.every(Boolean) && conflicts(next).size === 0) {
      setDone(true);
      awardPoints(POINTS[level], "GAME_RESULT", `Solved a ${level} Sudoku`);
    }
  }

  function onKey(e: KeyboardEvent) {
    if (selected === null) return;
    if (/^[1-9]$/.test(e.key)) put(Number(e.key));
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") put(0);
    else {
      const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (move === undefined) return;
      e.preventDefault();
      const next = selected + move;
      if (next >= 0 && next < 81 && !(Math.abs(move) === 1 && Math.floor(next / 9) !== Math.floor(selected / 9))) {
        setSelected(next);
        document.getElementById(`cell-${next}`)?.focus();
      }
    }
  }

  const sel = selected === null ? null : { r: Math.floor(selected / 9), c: selected % 9, n: grid[selected] };
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/games" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All games
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
        <Card className="p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
              <Timer className="size-4 text-muted" aria-hidden /> {time}
            </span>
            <span className="text-muted tabular-nums">{filled}/81 filled</span>
          </div>
          <div
            className="grid aspect-square grid-cols-9 overflow-hidden rounded-xl border-2 border-fg/70"
            role="grid"
            aria-label="Sudoku board. Use arrow keys to move and number keys to fill."
            onKeyDown={onKey}
          >
            {grid.map((n, i) => {
              const r = Math.floor(i / 9);
              const c = i % 9;
              const given = !!puzzle[i];
              const related = sel && (sel.r === r || sel.c === c || (Math.floor(sel.r / 3) === Math.floor(r / 3) && Math.floor(sel.c / 3) === Math.floor(c / 3)));
              const same = sel && sel.n && n === sel.n;
              return (
                <button
                  key={i}
                  id={`cell-${i}`}
                  type="button"
                  role="gridcell"
                  onClick={() => setSelected(i)}
                  aria-label={`Row ${r + 1}, column ${c + 1}${n ? `, ${n}` : ", empty"}${given ? ", given" : ""}${bad.has(i) ? ", conflict" : ""}`}
                  className={cn(
                    "flex aspect-square cursor-pointer items-center justify-center text-lg font-semibold tabular-nums transition-colors sm:text-2xl",
                    "border-line",
                    c % 3 === 2 && c !== 8 ? "border-r-2 border-r-fg/70" : c !== 8 && "border-r",
                    r % 3 === 2 && r !== 8 ? "border-b-2 border-b-fg/70" : r !== 8 && "border-b",
                    selected === i ? "bg-brand text-brand-fg" : same ? "bg-brand-soft" : related ? "bg-surface-2" : "bg-surface",
                    selected !== i && (bad.has(i) ? "text-danger" : given ? "text-fg" : "text-brand-text"),
                    given ? "font-bold" : "font-medium",
                  )}
                >
                  {n || ""}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Button key={n} variant="secondary" className="text-lg tabular-nums" onClick={() => put(n)} aria-label={`Enter ${n}`}>
                {n}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => put(0)} aria-label="Erase">
              <Eraser className="size-5" />
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h1 className="text-xl font-bold tracking-tight">Sudoku</h1>
            <p className="mt-1 text-sm text-muted">Fill every row, column and 3×3 box with 1 to 9. Numbers that clash turn red.</p>
            <Tabs
              label="Difficulty"
              value={level}
              onChange={start}
              className="mt-4"
              tabs={[
                { id: "easy", label: "Easy" },
                { id: "medium", label: "Medium" },
                { id: "hard", label: "Hard" },
              ]}
            />
            <Badge tone="points" className="mt-4">
              <Coins aria-hidden /> Solve = {POINTS[level]} points
            </Badge>
            <div className="mt-5">
              <Button variant="secondary" onClick={() => start(level)}>
                <RotateCcw aria-hidden /> New puzzle
              </Button>
            </div>
          </Card>
          {done && (
            <Card className="animate-enter border-success/40 bg-success-soft p-5" role="status">
              <p className="flex items-center gap-2 font-bold">
                <Trophy className="size-5 text-points" aria-hidden /> Solved in {time}!
              </p>
              <p className="mt-1 text-sm">You earned {POINTS[level]} points. Try a harder one?</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
