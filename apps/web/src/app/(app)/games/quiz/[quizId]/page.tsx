import { notFound } from "next/navigation";
import { QUIZZES } from "@/lib/demo/seed";
import { QuizPlayer } from "./quiz-player";

export function generateStaticParams() {
  return QUIZZES.map((q) => ({ quizId: q.id }));
}

export default async function QuizPage({ params }: PageProps<"/games/quiz/[quizId]">) {
  const { quizId } = await params;
  if (!QUIZZES.some((q) => q.id === quizId)) notFound();
  return <QuizPlayer quizId={quizId} />;
}
