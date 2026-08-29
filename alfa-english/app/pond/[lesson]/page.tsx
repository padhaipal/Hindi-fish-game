import PondHopGame from "@/components/pond/PondHopGame";
import { READING_LESSONS } from "@/lib/lessons";

export function generateStaticParams() {
  return READING_LESSONS.map((l) => ({ lesson: `lesson-${l.n}` }));
}

export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const n = parseInt(lesson.replace(/\D/g, ""), 10) || READING_LESSONS[0].n;
  return <PondHopGame lesson={n} />;
}
