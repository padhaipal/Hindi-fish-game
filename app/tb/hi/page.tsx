import type { Metadata } from "next";
import TbGame from "@/components/tb/TbGame";

// ---------------------------------------------------------------------------
// /tb/hi — the same Hindi game as /tb, so that /tb/hi and /tb/en pair up.
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "टीबी का सफ़र",
  description:
    "टीबी का पूरा इलाज कीजिए — ज़िंदा रहिए, ठीक हो जाइए, और घर में किसी को टीबी मत होने दीजिए।",
};

export default function TbHindiPage() {
  return <TbGame lang="hi" />;
}
