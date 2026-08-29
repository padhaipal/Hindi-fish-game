import LessonPicker from "@/components/shared/LessonPicker";
import { READING_LESSONS } from "@/lib/lessons";

export default function Page() {
  return (
    <LessonPicker
      base="/pond"
      title="Frog Jump"
      emoji="🐸"
      hint="Hop on the stones with the right letter"
      lessons={READING_LESSONS}
    />
  );
}
