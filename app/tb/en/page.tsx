import type { Metadata } from "next";
import TbGame from "@/components/tb/TbGame";

// ---------------------------------------------------------------------------
// /tb/en — the same game, in English. Same scenes, same choices, same numbers;
// only the words change (lib/tb/en.ts).
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "The TB Journey",
  description:
    "Finish TB treatment alive, cured, and without giving TB to anyone at home.",
};

export default function TbEnglishPage() {
  return <TbGame lang="en" />;
}
