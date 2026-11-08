"use client";

import { ArrowLeft, Circle, Coins, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

type Cell = "X" | "O" | null;
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const WIN_POINTS = 15;

function winner(b: Cell[]) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a], line: [a, c, d] };
  return null;
}

/** Simple opponent: win, block, centre, corner, anything. */
function computerMove(b: Cell[]) {
  const empty = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  for (const mark of ["O", "X"] as const) {
    for (const i of empty) {
      const t = [...b];
      t[i] = mark;
      if (winner(t)?.mark === mark) return i;
    }
  }
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  const pool = corners.length ? corners : empty;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function TicTacToePage() {
  return (
    <Guard feature="games">
      <Game />
    </Guard>
  );
}

function Game() {
  const { me, awardPoints } = useDemo();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [score, setScore] = useState({ you: 0, cpu: 0, draws: 0 });
  const result = winner(board);
  const full = board.every(Boolean);
  const over = !!result || full;
  const xTurn = board.filter(Boolean).length % 2 === 0;

  /** Place a move; if it ends the game, record the result right here (once). */
  function apply(next: Cell[]) {
    setBoard(next);
    const w = winner(next);
    if (!w && !next.every(Boolean)) return;
    if (w?.mark === "X") {
      setScore((s) => ({ ...s, you: s.you + 1 }));
      awardPoints(WIN_POINTS, "GAME_RESULT", "Won Tic-Tac-Toe");
    } else if (w?.mark === "O") setScore((s) => ({ ...s, cpu: s.cpu + 1 }));
    else setScore((s) => ({ ...s, draws: s.draws + 1 }));
  }

  // Computer plays O after a short pause.
  useEffect(() => {
    if (over || xTurn) return;
    const t = setTimeout(() => {
      const n = [...board];
      n[computerMove(board)] = "O";
      apply(n);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `apply` only closes over setters and awardPoints
  }, [board, over, xTurn]);

  function play(i: number) {
    if (over || !xTurn || board[i]) return;
    const n = [...board];
    n[i] = "X";
    apply(n);
  }

  const status = result
    ? result.mark === "X"
      ? `You win! +${WIN_POINTS} points`
      : "The computer wins this round"
    : full
      ? "It's a draw"
      : xTurn
        ? "Your turn. You're X."
        : "Computer is thinking…";

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/games" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All games
      </Link>
      <Card className="mt-4 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Tic-Tac-Toe</h1>
          <Badge tone="points">
            <Coins aria-hidden /> Win = {WIN_POINTS} pts
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-3 items-center gap-2 rounded-2xl bg-surface-2 p-3 text-center text-sm">
          <div className="flex flex-col items-center gap-1">
            {me && <Avatar name={me.name} size="sm" />}
            <span className="font-semibold">You</span>
            <span className="text-lg font-bold tabular-nums">{score.you}</span>
          </div>
          <div className="text-muted">
            <span className="block text-xs">Draws</span>
            <span className="text-lg font-bold tabular-nums">{score.draws}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-xs font-bold">CPU</span>
            <span className="font-semibold">Computer</span>
            <span className="text-lg font-bold tabular-nums">{score.cpu}</span>
          </div>
        </div>

        <p
          aria-live="polite"
          className={cn("mt-6 text-center font-semibold", result?.mark === "X" ? "text-success" : result?.mark === "O" ? "text-danger" : "text-fg")}
        >
          {status}
        </p>

        <div className="mx-auto mt-4 grid aspect-square max-w-80 grid-cols-3 gap-2" role="grid" aria-label="Game board">
          {board.map((cell, i) => {
            const inLine = result?.line.includes(i);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                onClick={() => play(i)}
                disabled={over || !xTurn || !!cell}
                aria-label={`Square ${i + 1}${cell ? `, ${cell}` : ", empty"}`}
                className={cn(
                  "flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 transition duration-150 disabled:cursor-default",
                  inLine ? "border-brand bg-brand-soft" : "border-line bg-surface",
                  !cell && !over && xTurn && "hover:border-brand hover:bg-brand-soft active:scale-95",
                )}
              >
                {cell === "X" && <X className="size-12 animate-enter text-brand-text" strokeWidth={2.5} aria-hidden />}
                {cell === "O" && <Circle className="size-10 animate-enter text-points" strokeWidth={2.5} aria-hidden />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant={over ? "primary" : "secondary"} onClick={() => setBoard(Array(9).fill(null))}>
            <RotateCcw aria-hidden /> {over ? "Play again" : "Restart"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
