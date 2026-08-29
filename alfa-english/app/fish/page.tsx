import LessonPicker from "@/components/shared/LessonPicker";
import { READING_LESSONS } from "@/lib/lessons";

export default function Page() {
  return (
    <LessonPicker
      base="/fish"
      title="Fish Game"
      emoji="🐟"
      hint="Catch the fish with the right letter"
      lessons={READING_LESSONS}
    />
  );
}
