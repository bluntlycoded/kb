"use client";

import { ArrowLeft, ArrowRight, Check, Coins, RotateCcw, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QUIZZES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

export function QuizPlayer({ quizId }: { quizId: string }) {
  return (
    <Guard feature="games">
      <Player quizId={quizId} />
    </Guard>
  );
}

function Player({ quizId }: { quizId: string }) {
  const quiz = QUIZZES.find((q) => q.id === quizId)!;
  const { awardPoints } = useDemo();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = quiz.questions[index];
  const total = quiz.questions.length;
  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    const finalScore = score;
    if (finalScore > 0) awardPoints(finalScore * quiz.pointsPerCorrect, "QUIZ_RESULT", `${quiz.title} quiz: ${finalScore}/${total}`);
    setDone(true);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/games" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All games
      </Link>

      {done ? (
        <Card className="mt-4 animate-enter p-8 text-center">
          <span className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-points-soft text-points">
            <Trophy className="size-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            You scored {score} out of {total}
          </h1>
          <p className="mt-2 text-muted">
            {score === total ? "Perfect round! " : score >= total / 2 ? "Nicely done. " : "Good effort. "}
            {score > 0 ? `You earned ${score * quiz.pointsPerCorrect} points.` : "Have another go to earn points."}
          </p>
          {score > 0 && (
            <Badge tone="points" className="mt-4 px-3 py-1 text-sm">
              <Coins aria-hidden /> +{score * quiz.pointsPerCorrect} points
            </Badge>
          )}
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="secondary" onClick={restart}>
              <RotateCcw aria-hidden /> Play again
            </Button>
            <ButtonLink href="/games">Back to games</ButtonLink>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-text">{quiz.title}</p>
              <p className="text-sm text-muted">
                Question {index + 1} of {total}
              </p>
            </div>
            <Badge tone="points">
              <Coins aria-hidden /> {score * quiz.pointsPerCorrect} pts
            </Badge>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={index + (answered ? 1 : 0)}
            aria-label="Quiz progress"
          >
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
          </div>

          <h1 key={index} className="mt-8 animate-enter text-xl font-bold tracking-tight sm:text-2xl">
            {q.prompt}
          </h1>

          <ul className="mt-6 grid gap-3" aria-label="Answers">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctIndex;
              const isPicked = i === picked;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    disabled={answered}
                    className={cn(
                      "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 text-left font-semibold transition duration-150 disabled:cursor-default",
                      !answered && "border-line hover:border-brand hover:bg-brand-soft active:scale-[0.99]",
                      answered && isCorrect && "border-success bg-success-soft",
                      answered && isPicked && !isCorrect && "border-danger bg-danger-soft",
                      answered && !isPicked && !isCorrect && "border-line opacity-60",
                    )}
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {answered && isCorrect && <Check className="size-5 text-success" aria-label="Correct answer" />}
                    {answered && isPicked && !isCorrect && <X className="size-5 text-danger" aria-label="Your answer, incorrect" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex min-h-11 items-center justify-between gap-4" aria-live="polite">
            <p className={cn("text-sm font-semibold", !answered && "invisible", picked === q.correctIndex ? "text-success" : "text-danger")}>
              {answered && (picked === q.correctIndex ? `Correct! +${quiz.pointsPerCorrect} points` : `Not quite. It's "${q.options[q.correctIndex]}".`)}
            </p>
            <Button onClick={next} disabled={!answered}>
              {index + 1 < total ? "Next question" : "See results"} <ArrowRight aria-hidden />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
