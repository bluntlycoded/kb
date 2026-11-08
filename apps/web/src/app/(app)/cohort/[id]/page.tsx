import { createSeed } from "@/lib/demo/seed";
import { CohortSpace } from "./cohort-space";

export function generateStaticParams() {
  return createSeed().cohorts.map((c) => ({ id: c.id }));
}

export default async function CohortSpacePage({ params }: PageProps<"/cohort/[id]">) {
  const { id } = await params;
  return <CohortSpace id={id} />;
}
