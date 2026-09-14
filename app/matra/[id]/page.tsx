import { notFound } from "next/navigation";
import MatraAdventure from "@/components/matra/MatraAdventure";
import { MATRAS } from "@/lib/matras";

// One static page per matra → a unique deep link (great for QR codes):
//   /matra/aa, /matra/i, /matra/ii, …
export function generateStaticParams() {
  return MATRAS.map((m) => ({ id: m.id }));
}

export const dynamicParams = false;

export default async function MatraJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!MATRAS.some((m) => m.id === id)) notFound();
  return <MatraAdventure matraId={id} />;
}
