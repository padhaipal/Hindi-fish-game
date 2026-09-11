// ---------------------------------------------------------------------------
// TB GAME — LINE DRAWINGS
// ---------------------------------------------------------------------------
// People are drawn as plain stick figures on purpose. The game talks about
// serious things — illness, money, death — and a simple outline keeps that
// bearable, while still being readable on a cheap phone screen. Everything is
// one ink colour plus one accent, so it stays clear in bright sunlight.
//
// TbArt  — the big picture at the top of a scene   (160 x 120)
// TbIcon — the small picture on a choice button    (48 x 48)
// ---------------------------------------------------------------------------

import type { ArtName, IconName } from "@/lib/tb/types";
import type { ReactNode } from "react";

// ---- shared pieces --------------------------------------------------------

/** One person. `x`,`y` is the point between the feet. */
function Stick({
  x,
  y,
  scale = 1,
  arms = "M-14 -42 L0 -50 L14 -42",
  legs = "M-12 0 L0 -26 L12 0",
  extra,
  faint = false,
}: {
  x: number;
  y: number;
  scale?: number;
  arms?: string;
  legs?: string;
  extra?: ReactNode;
  faint?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={faint ? 0.35 : 1}>
      <circle cx="0" cy="-62" r="10" />
      <path d="M0 -52 L0 -26" />
      <path d={arms} />
      <path d={legs} />
      {extra}
    </g>
  );
}

/** Coughed-out air. This is how TB travels, so it is always the accent colour. */
function Puffs({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="tbAccent">
      <path d="M0 0 q7 -6 14 -1" />
      <path d="M4 10 q8 -6 16 -1" />
      <path d="M2 -11 q6 -5 12 -1" />
    </g>
  );
}

/** A one-room house. With people drawn inside it, the doorway is left out and
 *  a window takes its place — the window is the thing that saves lives here. */
function Hut({
  x,
  y,
  w = 70,
  door = true,
}: {
  x: number;
  y: number;
  w?: number;
  door?: boolean;
}) {
  const h = w * 0.62;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2} 0 L${-w / 2} ${-h} L0 ${-h - 22} L${w / 2} ${-h} L${w / 2} 0 Z`} />
      {door ? (
        <rect x={-10} y={-26} width="20" height="26" />
      ) : (
        <g>
          <rect x={w / 2 - 26} y={-54} width="18" height="18" />
          <path d={`M${w / 2 - 17} -54 L${w / 2 - 17} -36 M${w / 2 - 26} -45 L${w / 2 - 8} -45`} />
        </g>
      )}
    </g>
  );
}

function Building({ x, y, mark }: { x: number; y: number; mark: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-38" y="-62" width="76" height="62" />
      <rect x="-10" y="-24" width="20" height="24" />
      <rect x="-30" y="-52" width="14" height="14" />
      <rect x="16" y="-52" width="14" height="14" />
      {mark}
    </g>
  );
}

// ---- the big scene pictures ----------------------------------------------

function art(name: ArtName): ReactNode {
  switch (name) {
    case "cough":
      return (
        <>
          <Stick x={58} y={106} arms="M-15 -38 L0 -50 L11 -58" />
          <Puffs x={78} y={44} />
        </>
      );

    case "coughBlood":
      return (
        <>
          <Stick x={58} y={106} arms="M-15 -36 L0 -50 L11 -58" />
          <Puffs x={78} y={44} />
          <g className="tbAccent tbFill">
            <circle cx="100" cy="52" r="3.5" />
            <circle cx="110" cy="62" r="2.5" />
            <circle cx="96" cy="66" r="2" />
          </g>
        </>
      );

    case "weak":
      return (
        <>
          {/* sitting, leaning on a hand — too weak to stand */}
          <Stick
            x={62}
            y={100}
            arms="M-20 -20 L0 -46 L16 -34"
            legs="M-4 -22 L-22 -6 M-4 -22 L18 -14"
          />
          <path d="M20 100 L140 100" />
        </>
      );

    case "chemist":
      return (
        <>
          <path d="M22 100 L138 100" />
          <rect x="70" y="58" width="62" height="42" />
          <path d="M70 58 L132 58" />
          <rect x="88" y="66" width="12" height="22" rx="2" />
          <rect x="108" y="70" width="12" height="18" rx="2" />
          <Stick x={40} y={100} scale={0.9} arms="M-13 -40 L0 -48 L15 -44" />
        </>
      );

    case "quack":
      return (
        <>
          <path d="M20 100 L140 100" />
          <Stick x={52} y={100} scale={0.9} />
          <Stick x={104} y={100} scale={0.9} arms="M-14 -42 L0 -48 L18 -52" />
          {/* a syringe, and a certificate that is not there */}
          <g className="tbAccent">
            <path d="M120 46 L136 46" />
            <path d="M122 41 L122 51" />
            <path d="M134 40 L134 52" />
            <path d="M104 24 L128 24 M104 24 L116 12 M128 24 L116 12" opacity="0.001" />
          </g>
        </>
      );

    case "clinic":
      return (
        <>
          <path d="M14 100 L146 100" />
          <Building
            x={80}
            y={100}
            mark={
              <g className="tbAccent">
                <path d="M-8 -76 L8 -76 M0 -84 L0 -68" />
                <path d="M0 -62 L0 -76" />
              </g>
            }
          />
          <Stick x={26} y={100} scale={0.72} />
        </>
      );

    case "privateClinic":
      return (
        <>
          <path d="M14 100 L146 100" />
          <Building
            x={80}
            y={100}
            mark={
              <g className="tbAccent">
                <path d="M-10 -84 L8 -84 M-10 -78 L8 -78 M-10 -72 L2 -72 Q10 -78 2 -84 M-2 -72 L8 -62" />
              </g>
            }
          />
        </>
      );

    case "labTest":
      return (
        <>
          <path d="M14 100 L146 100" />
          {/* sputum cup */}
          <path d="M26 66 L34 100 L62 100 L70 66 Z" />
          <path d="M22 66 L74 66" />
          {/* the machine that reads it */}
          <rect x="90" y="48" width="54" height="52" rx="4" />
          <circle cx="117" cy="70" r="12" className="tbAccent" />
          <path d="M111 70 L123 70 M117 64 L117 76" className="tbAccent" />
          <path d="M100 90 L134 90" />
        </>
      );

    case "goodNews":
      return (
        <>
          <rect x="42" y="22" width="76" height="76" rx="3" />
          <path d="M54 44 L106 44 M54 58 L92 58" />
          <path d="M58 76 L72 90 L102 66" className="tbAccent" strokeWidth="5" />
        </>
      );

    case "badNews":
      return (
        <>
          <rect x="42" y="22" width="76" height="76" rx="3" />
          <path d="M54 42 L106 42 M54 54 L92 54" />
          <g className="tbAccent">
            <circle cx="80" cy="76" r="14" />
            <path d="M80 66 L80 86 M70 76 L90 76" />
          </g>
        </>
      );

    case "pillsDaily":
      return (
        <>
          {/* a blister strip: the same pills, every single day */}
          <rect x="26" y="40" width="108" height="42" rx="6" />
          {[46, 72, 98].map((cx) => (
            <circle key={cx} cx={cx} cy="54" r="8" />
          ))}
          {[46, 72, 98].map((cx) => (
            <circle key={`b${cx}`} cx={cx} cy="70" r="8" />
          ))}
          <path d="M118 54 L126 54 M118 70 L126 70" className="tbAccent" />
          <path d="M26 94 L134 94" className="tbAccent" />
        </>
      );

    case "smallHome":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Hut x={80} y={100} w={112} door={false} />
          <Stick x={50} y={98} scale={0.5} />
          <Stick x={74} y={98} scale={0.5} />
          <Stick x={96} y={98} scale={0.38} />
          <Puffs x={58} y={44} />
        </>
      );

    case "family":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Stick x={36} y={100} scale={0.72} />
          <Stick x={70} y={100} scale={0.72} />
          <Stick x={100} y={100} scale={0.52} />
          <Stick x={126} y={100} scale={0.46} />
        </>
      );

    case "familyTest":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Stick x={30} y={100} scale={0.66} />
          <Stick x={58} y={100} scale={0.66} />
          <Stick x={82} y={100} scale={0.46} />
          <g className="tbAccent">
            <rect x="104" y="34" width="40" height="50" rx="3" />
            <path d="M112 52 L120 60 L136 44" strokeWidth="5" />
            <path d="M112 70 L136 70" />
          </g>
        </>
      );

    case "food":
      return (
        <>
          <ellipse cx="80" cy="72" rx="52" ry="22" />
          <circle cx="60" cy="68" r="12" />
          <path d="M86 60 q14 -6 22 6 q-12 10 -22 -6" />
          <path d="M28 100 L132 100" />
          <path d="M96 78 q10 4 16 -2" className="tbAccent" />
        </>
      );

    case "money":
      return (
        <>
          <rect x="34" y="44" width="92" height="52" rx="4" />
          <circle cx="80" cy="70" r="16" />
          <g className="tbAccent">
            <path d="M72 62 L88 62 M72 68 L88 68 M72 74 L80 74 Q90 68 80 62 M78 74 L88 86" />
          </g>
          <path d="M44 30 L116 30" />
        </>
      );

    case "work":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Stick x={54} y={100} arms="M-16 -46 L0 -50 L16 -46" extra={<rect x="-18" y="-72" width="36" height="12" />} />
          <rect x="98" y="76" width="40" height="12" />
          <rect x="104" y="64" width="28" height="12" />
        </>
      );

    case "travel":
      return (
        <>
          <path d="M6 100 L154 100" />
          <rect x="24" y="40" width="106" height="48" rx="6" />
          <rect x="34" y="50" width="22" height="18" />
          <rect x="64" y="50" width="22" height="18" />
          <rect x="94" y="50" width="22" height="18" />
          <circle cx="46" cy="94" r="8" />
          <circle cx="112" cy="94" r="8" />
        </>
      );

    case "calendar":
      return (
        <>
          <rect x="28" y="26" width="104" height="76" rx="4" />
          <path d="M28 44 L132 44 M48 26 L48 18 M112 26 L112 18" />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => (
              <path
                key={`${r}${c}`}
                d={`M${46 + c * 44} ${62 + r * 16} l6 7 l14 -14`}
                className="tbAccent"
              />
            ))
          )}
        </>
      );

    case "neighbours":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Stick x={44} y={100} scale={0.82} />
          <Stick x={116} y={100} scale={0.82} arms="M-16 -44 L0 -50 L14 -46" />
          <g className="tbAccent">
            <path d="M66 34 q14 -12 28 0 q-4 12 -14 10 l-8 8 l0 -8 q-8 -2 -6 -10 Z" />
          </g>
        </>
      );

    case "strong":
      return (
        <>
          <path d="M10 100 L150 100" />
          <Stick x={80} y={100} arms="M-20 -66 L0 -48 L20 -66" />
          <g className="tbAccent">
            <circle cx="128" cy="30" r="10" />
            <path d="M128 12 L128 6 M128 54 L128 48 M146 30 L152 30 M110 30 L104 30" />
          </g>
        </>
      );

    case "resting":
      return (
        <>
          <path d="M20 92 L140 92 M32 92 L32 104 M128 92 L128 104" />
          <circle cx="46" cy="80" r="9" />
          <path d="M56 82 L118 82" />
        </>
      );

    case "gone":
      // A small oil lamp, no figure. Death is named in words, not drawn.
      return (
        <>
          <path d="M50 88 q30 14 60 0 q-6 -14 -30 -14 q-24 0 -30 14 Z" />
          <path d="M40 100 L120 100" />
          <path d="M80 74 q-10 -12 0 -24 q10 12 0 24" className="tbAccent" />
        </>
      );
  }
}

export function TbArt({ name }: { name: ArtName }) {
  return (
    <svg className="tbArt" viewBox="0 0 160 120" aria-hidden="true">
      {art(name)}
    </svg>
  );
}

// ---- the small choice pictures -------------------------------------------

function icon(name: IconName): ReactNode {
  switch (name) {
    case "wait":
      return (
        <>
          <circle cx="24" cy="24" r="16" />
          <path d="M24 14 L24 24 L31 29" />
        </>
      );
    case "chemist":
      return (
        <>
          <rect x="14" y="12" width="20" height="28" rx="4" />
          <path d="M18 6 L30 6 L30 12 L18 12 Z" />
          <path d="M24 20 L24 32 M18 26 L30 26" className="tbAccent" />
        </>
      );
    case "quack":
      return (
        <>
          <path d="M10 34 L28 16" />
          <path d="M24 10 L38 24" />
          <path d="M28 8 L34 14 M20 20 L28 28" />
          <path d="M8 40 L16 32" className="tbAccent" />
        </>
      );
    case "clinic":
      return (
        <>
          <rect x="8" y="14" width="32" height="26" />
          <rect x="20" y="28" width="8" height="12" />
          <path d="M24 4 L24 14 M19 9 L29 9" className="tbAccent" />
        </>
      );
    case "privateClinic":
      return (
        <>
          <rect x="8" y="14" width="32" height="26" />
          <rect x="20" y="28" width="8" height="12" />
          <path d="M18 6 L30 6 M18 10 L30 10 M18 14 L24 14 Q32 10 24 6 M22 14 L30 22" className="tbAccent" />
        </>
      );
    case "spit":
      return (
        <>
          <path d="M14 18 L18 40 L30 40 L34 18 Z" />
          <path d="M11 18 L37 18" />
          <path d="M24 6 q6 4 0 10" className="tbAccent" />
        </>
      );
    case "yes":
      return <path d="M10 26 L20 36 L38 12" strokeWidth="5" className="tbGood" />;
    case "no":
      return (
        <g className="tbBad">
          <path d="M12 12 L36 36 M36 12 L12 36" strokeWidth="5" />
        </g>
      );
    case "pill":
      return (
        <>
          <rect x="8" y="18" width="32" height="14" rx="7" />
          <path d="M24 18 L24 32" />
        </>
      );
    case "pillFood":
      return (
        <>
          <ellipse cx="24" cy="32" rx="16" ry="7" />
          <rect x="14" y="10" width="20" height="10" rx="5" />
          <path d="M24 10 L24 20" />
        </>
      );
    case "stopPill":
      return (
        <>
          <rect x="8" y="18" width="32" height="14" rx="7" />
          <path d="M8 40 L40 8" strokeWidth="5" className="tbBad" />
        </>
      );
    case "mask":
      return (
        <>
          <path d="M12 16 q12 -6 24 0 l0 14 q-12 8 -24 0 Z" />
          <path d="M12 20 L4 16 M36 20 L44 16" />
        </>
      );
    case "window":
      return (
        <>
          <rect x="10" y="10" width="28" height="28" />
          <path d="M24 10 L24 38 M10 24 L38 24" />
          <path d="M40 14 q8 6 0 12" className="tbAccent" />
        </>
      );
    case "sleepApart":
      return (
        <>
          <path d="M6 30 L20 30 M6 30 L6 38 M20 30 L20 38" />
          <path d="M28 30 L42 30 M28 30 L28 38 M42 30 L42 38" />
          <circle cx="10" cy="22" r="4" />
          <circle cx="38" cy="22" r="4" />
        </>
      );
    case "familyTest":
      return (
        <>
          <circle cx="12" cy="16" r="5" />
          <path d="M12 21 L12 34 M6 38 L12 34 L18 38" />
          <circle cx="28" cy="18" r="4" />
          <path d="M28 22 L28 34 M23 38 L28 34 L33 38" />
          <path d="M36 14 L40 18 L46 8" className="tbGood" />
        </>
      );
    case "child":
      return (
        <>
          <circle cx="24" cy="16" r="7" />
          <path d="M24 23 L24 34 M16 28 L32 28 M18 40 L24 34 L30 40" />
        </>
      );
    case "food":
      return (
        <>
          <ellipse cx="24" cy="28" rx="17" ry="8" />
          <circle cx="18" cy="26" r="5" />
          <path d="M28 22 q7 -2 10 4 q-6 5 -10 -4" />
        </>
      );
    case "money":
      return (
        <>
          <rect x="6" y="16" width="36" height="20" rx="3" />
          <path d="M18 21 L30 21 M18 25 L30 25 M18 29 L24 29 Q32 25 24 21 M22 29 L30 35" className="tbAccent" />
        </>
      );
    case "loan":
      return (
        <>
          <path d="M8 36 q16 -20 32 0" />
          <path d="M24 8 L24 22 M18 16 L24 22 L30 16" className="tbBad" />
        </>
      );
    case "work":
      return (
        <>
          <rect x="8" y="26" width="32" height="10" />
          <rect x="14" y="16" width="20" height="10" />
          <path d="M24 8 L24 16" />
        </>
      );
    case "rest":
      return (
        <>
          <path d="M6 32 L42 32 M6 32 L6 40 M42 32 L42 40" />
          <circle cx="14" cy="24" r="5" />
          <path d="M20 26 L38 26" />
        </>
      );
    case "bus":
      return (
        <>
          <rect x="6" y="12" width="36" height="20" rx="3" />
          <rect x="10" y="16" width="9" height="8" />
          <rect x="23" y="16" width="9" height="8" />
          <circle cx="14" cy="36" r="4" />
          <circle cx="34" cy="36" r="4" />
        </>
      );
    case "phone":
      return (
        <>
          <rect x="14" y="6" width="20" height="36" rx="3" />
          <path d="M20 36 L28 36" />
          <path d="M18 12 L30 12" className="tbAccent" />
        </>
      );
    case "bidi":
      return (
        <>
          <path d="M8 30 L34 30" strokeWidth="6" />
          <path d="M38 30 L42 30" strokeWidth="6" className="tbAccent" />
          <path d="M30 20 q6 -8 0 -14" className="tbAccent" />
        </>
      );
    case "sharab":
      return (
        <>
          <path d="M18 8 L30 8 L30 16 L34 24 L34 40 L14 40 L14 24 L18 16 Z" />
          <path d="M14 28 L34 28" className="tbAccent" />
        </>
      );
    case "talk":
      return (
        <>
          <path d="M8 10 L40 10 L40 30 L22 30 L14 38 L14 30 L8 30 Z" />
          <path d="M16 18 L32 18 M16 24 L26 24" className="tbAccent" />
        </>
      );
    case "hide":
      return (
        <>
          <circle cx="24" cy="20" r="9" />
          <path d="M10 24 L38 24" strokeWidth="6" />
          <path d="M24 29 L24 40" />
        </>
      );
    case "help":
      return (
        <>
          <circle cx="16" cy="16" r="6" />
          <path d="M16 22 L16 34 M8 40 L16 34 L24 40" />
          <path d="M30 26 L42 26 M36 20 L36 32" className="tbGood" strokeWidth="5" />
        </>
      );
    case "doctor":
      return (
        <>
          <circle cx="24" cy="14" r="7" />
          <path d="M24 21 L24 36 M12 40 L24 34 L36 40" />
          <path d="M18 24 q6 10 12 0" className="tbAccent" />
        </>
      );
  }
}

export function TbIcon({ name }: { name: IconName }) {
  return (
    <svg className="tbIcon" viewBox="0 0 48 48" aria-hidden="true">
      {icon(name)}
    </svg>
  );
}
