import { createSeed } from "@/lib/demo/seed";
import { ColleagueProfile } from "./colleague-profile";

export function generateStaticParams() {
  return createSeed().people.map((p) => ({ id: p.id }));
}

export default async function ColleaguePage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  return <ColleagueProfile id={id} />;
}
