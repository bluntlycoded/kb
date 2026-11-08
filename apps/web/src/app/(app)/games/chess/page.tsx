"use client";

import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { ArrowLeft, Coins, RotateCcw, Undo2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

type Level = "easy" | "medium" | "hard";
type Mode = "cpu" | "local";
type Step = { from: string; to: string; promotion?: string };

const LEVEL_POINTS: Record<Level, number> = { easy: 10, medium: 20, hard: 30 };
const VALUE: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// U+FE0E asks for the text form of each glyph, not the emoji.
const GLYPH: Record<PieceSymbol, string> = { k: "\u265A\uFE0E", q: "\u265B\uFE0E", r: "\u265C\uFE0E", b: "\u265D\uFE0E", n: "\u265E\uFE0E", p: "\u265F\uFE0E" };
const NAME: Record<PieceSymbol, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

/** Material, plus a small bonus for central squares. Positive = good for black. */
function evaluate(g: Chess) {
  let score = 0;
  g.board().forEach((row, r) =>
    row.forEach((cell, f) => {
      if (!cell) return;
      const centre = cell.type === "k" ? 0 : 10 - (Math.abs(3.5 - r) + Math.abs(3.5 - f)) * 2;
      score += (cell.color === "b" ? 1 : -1) * (VALUE[cell.type] + centre);
    }),
  );
  return score;
}

function search(g: Chess, depth: number, alpha: number, beta: number, black: boolean): number {
  if (depth === 0) return evaluate(g);
  const moves = g.moves({ verbose: true });
  // No legal moves: checkmate (sooner is better) or stalemate.
  if (moves.length === 0) return g.isCheck() ? (black ? -100000 - depth : 100000 + depth) : 0;
  let best = black ? -Infinity : Infinity;
  for (const m of moves) {
    g.move(m);
    const v = search(g, depth - 1, alpha, beta, !black);
    g.undo();
    if (black) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function computerMove(fen: string, level: Level): Step {
  const g = new Chess(fen);
  const moves = g.moves({ verbose: true });
  if (level === "easy") {
    // Mostly random, but grabs a free piece now and then.
    const captures = moves.filter((m) => m.captured);
    const pool = captures.length && Math.random() < 0.5 ? captures : moves;
    const m = pool[Math.floor(Math.random() * pool.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }
  const depth = level === "medium" ? 1 : 2;
  let best: Move[] = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    g.move(m);
    const v = search(g, depth, bestScore === -Infinity ? -Infinity : bestScore - 1, Infinity, false);
    g.undo();
    if (v > bestScore) {
      bestScore = v;
      best = [m];
    } else if (v === bestScore) best.push(m);
  }
  const m = best[Math.floor(Math.random() * best.length)];
  return { from: m.from, to: m.to, promotion: m.promotion };
}

export default function ChessPage() {
  return (
    <Guard feature="games">
      <ChessGame />
    </Guard>
  );
}

function ChessGame() {
  const { awardPoints, state } = useDemo();
  const [mode, setMode] = useState<Mode>("cpu");
  const [level, setLevel] = useState<Level>("medium");
  const [steps, setSteps] = useState<Step[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);

  // Replay the moves so the game always matches the move list.
  const game = useMemo(() => {
    const g = new Chess();
    steps.forEach((s) => g.move(s));
    return g;
  }, [steps]);

  const over = game.isGameOver();
  const turn = game.turn();
  const cpuTurn = mode === "cpu" && turn === "b" && !over;
  const targets = useMemo(() => (selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []), [game, selected]);
  const last = game.history({ verbose: true }).at(-1);
  const history = game.history();

  useEffect(() => {
    if (!cpuTurn) return;
    const fen = game.fen();
    const t = setTimeout(() => {
      setThinking(true);
      // Let the "thinking" label paint before the search runs.
      setTimeout(() => {
        const m = computerMove(fen, level);
        setSteps((s) => [...s, m]);
        setThinking(false);
      }, 30);
    }, 350);
    return () => clearTimeout(t);
  }, [cpuTurn, game, level]);

  function play(step: Step) {
    const next = new Chess(game.fen());
    next.move(step);
    setSteps((s) => [...s, step]);
    setSelected(null);
    if (mode === "cpu" && next.isCheckmate()) awardPoints(LEVEL_POINTS[level], "GAME_RESULT", `Beat the computer at chess (${level})`);
  }

  function onSquare(sq: Square) {
    if (over || cpuTurn || thinking) return;
    const piece = game.get(sq);
    if (selected && targets.includes(sq)) return play({ from: selected, to: sq, promotion: "q" });
    if (piece && piece.color === turn && (mode === "local" || piece.color === "w")) return setSelected(sq === selected ? null : sq);
    setSelected(null);
  }

  function restart() {
    setSteps([]);
    setSelected(null);
  }

  function takeBack() {
    // Undo your move and the computer's reply.
    setSteps((s) => s.slice(0, mode === "cpu" ? Math.max(0, s.length - (turn === "w" ? 2 : 1)) : s.length - 1));
    setSelected(null);
  }

  const captured = useMemo(() => {
    const out: { w: PieceSymbol[]; b: PieceSymbol[] } = { w: [], b: [] };
    game.history({ verbose: true }).forEach((m) => m.captured && out[m.color].push(m.captured));
    return out;
  }, [game]);

  let status: string;
  if (game.isCheckmate()) {
    const whiteWon = turn === "b";
    status = mode === "cpu" ? (whiteWon ? `Checkmate! You win +${LEVEL_POINTS[level]} points` : "Checkmate. The computer wins") : `Checkmate. ${whiteWon ? "White" : "Black"} wins`;
  } else if (game.isStalemate()) status = "Stalemate. It's a draw";
  else if (game.isDraw()) status = "It's a draw";
  else if (thinking || cpuTurn) status = "Computer is thinking…";
  else status = `${mode === "cpu" ? "Your move" : turn === "w" ? "White to move" : "Black to move"}${game.isCheck() ? ". Check!" : ""}`;

  const board = game.board();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/games" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All games
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <Card className="p-3 sm:p-5">
          <p aria-live="polite" className={cn("mb-3 text-center font-semibold", game.isCheckmate() && turn === "b" ? "text-success" : game.isCheck() ? "text-danger" : "text-fg")}>
            {status}
          </p>
          <CapturedRow pieces={captured.b} color="w" label="Pieces you've lost" />
          <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-xl border border-line" role="grid" aria-label="Chess board">
            {board.map((row, r) =>
              row.map((cell, f) => {
                const sq = `${FILES[f]}${8 - r}` as Square;
                const dark = (r + f) % 2 === 1;
                const isTarget = targets.includes(sq);
                const isLast = last && (last.from === sq || last.to === sq);
                const inCheck = cell?.type === "k" && cell.color === turn && game.isCheck();
                return (
                  <button
                    key={sq}
                    type="button"
                    role="gridcell"
                    onClick={() => onSquare(sq)}
                    aria-label={`${sq}${cell ? `, ${cell.color === "w" ? "white" : "black"} ${NAME[cell.type]}` : ""}${isTarget ? ", possible move" : ""}`}
                    className={cn(
                      "relative flex aspect-square cursor-pointer items-center justify-center text-[min(9vw,3.1rem)] leading-none select-none",
                      dark ? "bg-[#b58863]" : "bg-[#f0d9b5]",
                      isLast && "after:absolute after:inset-0 after:bg-yellow-300/40",
                      selected === sq && "after:absolute after:inset-0 after:bg-brand/40",
                      inCheck && "after:absolute after:inset-0 after:bg-rose-500/50",
                    )}
                  >
                    {f === 0 && <span className={cn("absolute top-0.5 left-1 text-[10px] font-bold", dark ? "text-[#f0d9b5]" : "text-[#b58863]")}>{8 - r}</span>}
                    {r === 7 && <span className={cn("absolute right-1 bottom-0 text-[10px] font-bold", dark ? "text-[#f0d9b5]" : "text-[#b58863]")}>{FILES[f]}</span>}
                    {cell && (
                      <span
                        className={cn("relative z-10", cell.color === "w" ? "text-white" : "text-slate-900")}
                        style={{ textShadow: cell.color === "w" ? "0 0 2px #1e293b, 0 0 1px #1e293b, 0 1px 1px #1e293b" : "0 1px 0 rgb(255 255 255 / 0.25)" }}
                        aria-hidden
                      >
                        {GLYPH[cell.type]}
                      </span>
                    )}
                    {isTarget && (
                      <span
                        className={cn("absolute z-20 rounded-full", cell ? "inset-1 border-4 border-slate-900/30" : "size-[28%] bg-slate-900/30")}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              }),
            )}
          </div>
          <CapturedRow pieces={captured.w} color="b" label="Pieces you've captured" />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h1 className="text-xl font-bold tracking-tight">Chess</h1>
            <p className="mt-1 text-sm text-muted">You play white. Tap a piece, then a highlighted square.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Tabs
                label="Opponent"
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  restart();
                }}
                tabs={[
                  { id: "cpu", label: "vs Computer" },
                  { id: "local", label: "Two players, one device" },
                ]}
              />
              {mode === "cpu" && (
                <Tabs
                  label="Difficulty"
                  value={level}
                  onChange={(l) => {
                    setLevel(l);
                    restart();
                  }}
                  tabs={[
                    { id: "easy", label: "Easy" },
                    { id: "medium", label: "Medium" },
                    { id: "hard", label: "Hard" },
                  ]}
                />
              )}
            </div>
            {mode === "cpu" ? (
              <Badge tone="points" className="mt-4">
                <Coins aria-hidden /> Win = {LEVEL_POINTS[level]} points
              </Badge>
            ) : (
              <p className="mt-4 text-sm text-muted">Pass the device between moves. Games against a colleague on the same device don&apos;t earn points.</p>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant={over ? "primary" : "secondary"} onClick={restart}>
                <RotateCcw aria-hidden /> {over ? "New game" : "Restart"}
              </Button>
              <Button variant="ghost" onClick={takeBack} disabled={over || steps.length === 0 || thinking || cpuTurn}>
                <Undo2 aria-hidden /> Take back
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Moves</h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No moves yet.</p>
            ) : (
              <ol className="mt-2 grid max-h-64 grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 overflow-y-auto text-sm tabular-nums">
                {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                  <li key={i} className="contents">
                    <span className="text-muted">{i + 1}.</span>
                    <span className="font-medium">{history[i * 2]}</span>
                    <span className="font-medium">{history[i * 2 + 1] ?? ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          {state.company.games.includes("chess") && (
            <p className="text-sm text-muted">Want a real opponent? Go back to Games and invite a colleague who&apos;s active.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CapturedRow({ pieces, color, label }: { pieces: PieceSymbol[]; color: "w" | "b"; label: string }) {
  const sorted = [...pieces].sort((a, b) => VALUE[b] - VALUE[a]);
  return (
    <p className="my-2 flex min-h-7 flex-wrap items-center gap-0.5 text-2xl leading-none" aria-label={`${label}: ${sorted.length ? sorted.map((p) => NAME[p]).join(", ") : "none"}`}>
      {sorted.map((p, i) => (
        <span
          key={i}
          className={color === "w" ? "text-white" : "text-slate-900 dark:text-slate-300"}
          style={color === "w" ? { textShadow: "0 0 2px #1e293b, 0 0 1px #1e293b" } : undefined}
          aria-hidden
        >
          {GLYPH[p]}
        </span>
      ))}
    </p>
  );
}
