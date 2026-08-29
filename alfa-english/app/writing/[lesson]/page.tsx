import WritingGame from "@/components/writing/WritingGame";
import { WRITING_LESSONS } from "@/lib/lessons";

export function generateStaticParams() {
  return WRITING_LESSONS.map((l) => ({ lesson: `lesson-${l.n}` }));
}

export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const n = parseInt(lesson.replace(/\D/g, ""), 10) || WRITING_LESSONS[0].n;
  return <WritingGame lesson={n} />;
}
