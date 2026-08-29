import LessonPicker from "@/components/shared/LessonPicker";
import { WRITING_LESSONS } from "@/lib/lessons";

export default function Page() {
  return (
    <LessonPicker
      base="/writing"
      title="Writing"
      emoji="✏️"
      hint="Trace each letter the right way"
      lessons={WRITING_LESSONS}
    />
  );
}
