import LessonFlow from "@/components/lessons/LessonFlow";
import { READING_LESSONS } from "@/lib/lessons";

export function generateStaticParams() {
  return READING_LESSONS.map((l) => ({ n: String(l.n) }));
}

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = parseInt(n.replace(/\D/g, ""), 10) || READING_LESSONS[0].n;
  return <LessonFlow lesson={num} />;
}
