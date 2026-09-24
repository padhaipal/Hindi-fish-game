import { notFound } from "next/navigation";
import LetterAdventure from "@/components/adventure/LetterAdventure";
import { ALL_LETTERS } from "@/lib/letters";

// One static page per letter → a unique deep link (great for QR codes):
//   /letter/ka, /letter/sa, /letter/pa, …
export function generateStaticParams() {
  return ALL_LETTERS.map((l) => ({ id: l.id }));
}

export const dynamicParams = false;

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ALL_LETTERS.some((l) => l.id === id)) notFound();
  return <LetterAdventure letterId={id} />;
}
