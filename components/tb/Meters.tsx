// ---------------------------------------------------------------------------
// TB GAME — THE METERS
// ---------------------------------------------------------------------------
// Three things the player must watch, all drawn as pictures and colours rather
// than numbers, so they can be read without letters:
//
//   सेहत   a 10-step thermometer, red -> green: health, and the chance of
//          surviving. This is the meter that decides whether you live.
//   पैसा   10 coins: what is left in the house. Empty means hunger.
//   घर     one small figure per household member. A figure turns red when that
//          person has caught TB — losing even one means you have not fully won.
//
// A tap on any meter says out loud what it means.
// ---------------------------------------------------------------------------

import { healthColor, infectionChance, MAX_METER } from "@/lib/tb/engine";
import { FAMILY_LINES, HEALTH_LINES, MONEY_LINES } from "@/lib/tb/uiLines";
import type { GameState, Member } from "@/lib/tb/types";

/** A 10-step meter. Also used on the how-to-play screen. */
export function Bar({
  value,
  color,
  dim = "#00000018",
}: {
  value: number;
  color: string;
  dim?: string;
}) {
  return (
    <div className="tbBar">
      {Array.from({ length: MAX_METER }, (_, i) => (
        <span
          key={i}
          className="tbBarCell"
          style={{ background: i < value ? color : dim }}
        />
      ))}
    </div>
  );
}

/** One household member: line figure, tinted by how much TB air they breathed. */
export function MemberDot({ m }: { m: Member }) {
  const risk = infectionChance(m);
  const state = m.infected ? "ill" : risk > 0.4 ? "warn" : "ok";
  const scale = m.kind === "child" ? 0.8 : 1;
  return (
    <svg className={`tbMember tbMember--${state}`} viewBox="0 0 24 32" aria-hidden="true">
      <g transform={`translate(12 30) scale(${scale})`}>
        <circle cx="0" cy="-22" r="4.5" />
        <path d="M0 -17 L0 -8" />
        <path d="M-5 -14 L0 -16 L5 -14" />
        <path d="M-4 0 L0 -8 L4 0" />
      </g>
      {m.infected && <path className="tbMemberMark" d="M4 6 L20 22 M20 6 L4 22" />}
      {!m.infected && m.protectedByTpt && (
        <path className="tbMemberShield" d="M5 16 L10 22 L20 8" />
      )}
    </svg>
  );
}

export default function Meters({
  state,
  onSay,
  speakingId,
}: {
  state: GameState;
  onSay: (id: string, text: string) => void;
  /** Which line the voice is on, so the matching meter can light up. */
  speakingId?: string | null;
}) {
  const lit = (id: string) => (speakingId === id ? " tbReading" : "");
  // Each meter says a FIXED phrase, chosen by which band it is in — never a
  // sentence with a number in it, so each line can be recorded once.
  const health =
    state.health >= 7
      ? HEALTH_LINES.good
      : state.health >= 4
      ? HEALTH_LINES.mid
      : HEALTH_LINES.low;
  const money = state.money >= 3 ? MONEY_LINES.ok : MONEY_LINES.low;
  const family = state.members.some((m) => m.infected)
    ? FAMILY_LINES.ill
    : FAMILY_LINES.clear;

  return (
    <div className="tbMeters">
      <button
        className={`tbMeter${lit(health.id)}`}
        onClick={() => onSay(health.id, health.hi)}
        aria-label="सेहत"
      >
        <span className="tbMeterIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="tbMeterGlyph">
            <path d="M12 20 C6 15 3 12 3 8.5 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 21 8.5 C21 12 18 15 12 20 Z" />
          </svg>
        </span>
        <Bar value={state.health} color={healthColor(state.health)} />
      </button>

      <button
        className={`tbMeter${lit(money.id)}`}
        onClick={() => onSay(money.id, money.hi)}
        aria-label="पैसा"
      >
        <span className="tbMeterIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="tbMeterGlyph">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 8 L16 8 M8 11 L16 11 M8 14 L12 14 Q17 11 12 8 M11 14 L16 19" />
          </svg>
        </span>
        <Bar value={state.money} color="#e8a33d" />
      </button>

      <button
        className={`tbMeter tbMeter--family${lit(family.id)}`}
        onClick={() => onSay(family.id, family.hi)}
        aria-label="घर के लोग"
      >
        {state.members.map((m) => (
          <MemberDot key={m.id} m={m} />
        ))}
      </button>
    </div>
  );
}

/** The six months of treatment, as a row of boxes that fill up. */
export function MonthTrack({ month }: { month: number }) {
  return (
    <div className="tbMonths" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`tbMonth ${i < month ? "tbMonth--done" : ""}`}>
          {i < month ? (
            <svg viewBox="0 0 16 16">
              <path d="M3 8 L6 12 L13 4" />
            </svg>
          ) : null}
        </span>
      ))}
    </div>
  );
}
