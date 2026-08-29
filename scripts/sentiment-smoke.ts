/**
 * Communication-note sentiment — smoke tests for SANRAL SRM one-click analysis.
 *
 * Run: npx tsx scripts/sentiment-smoke.ts
 */

import {
  analyzeCommunicationNote,
  communicationNoteText,
  relationshipHealthFromLabels,
  sentimentLabelFromScore,
} from "../src/lib/sentimentAnalysis";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`,
  );
}

function main() {
  console.log("\n=== Communication-note sentiment smoke ===\n");

  const empty = analyzeCommunicationNote("   ");
  check("empty note is unlabeled/neutral", empty.label === "neutral" && empty.score === 0);

  const negative = analyzeCommunicationNote(
    "Residents were angry about clinic access flooding and threatened a protest if pumps are delayed.",
  );
  check(
    "anger + protest + delay → negative",
    negative.label === "negative",
    `got ${negative.label} (${negative.score})`,
  );

  const positive = analyzeCommunicationNote(
    "Youth forum thanked the contractor for local hire progress. The session was constructive; attendees supported the revised skills pipeline and appreciated the published roster.",
  );
  check(
    "thanks + constructive + support → positive",
    positive.label === "positive",
    `got ${positive.label} (${positive.score})`,
  );

  const neutral = analyzeCommunicationNote(
    "Traders were informed of a revised start window. Minutes noted; no further questions recorded.",
  );
  check(
    "informational minutes → neutral",
    neutral.label === "neutral",
    `got ${neutral.label} (${neutral.score})`,
  );

  const composed = communicationNoteText({
    title: "Ward briefing",
    summary: "Community members are frustrated and filed a complaint.",
    actionItems: ["Follow up Friday"],
  });
  const fromNote = analyzeCommunicationNote(composed);
  check(
    "title + summary + actions compose a scorable note",
    fromNote.label === "negative",
    `got ${fromNote.label} (${fromNote.score})`,
  );

  check("score 55 is positive", sentimentLabelFromScore(55) === "positive");
  check("score 0 is neutral", sentimentLabelFromScore(0) === "neutral");
  check("score -40 is negative", sentimentLabelFromScore(-40) === "negative");

  const alert = relationshipHealthFromLabels(
    ["negative", "negative", "positive"],
    [-40, -55, 30],
  );
  check(
    "majority negative notes raise an alert",
    alert.warning === "alert" && alert.negative === 2,
    `warning=${alert.warning} negative=${alert.negative}`,
  );

  const stable = relationshipHealthFromLabels(
    ["positive", "positive", "neutral"],
    [40, 55, 0],
  );
  check(
    "mostly constructive notes are stable",
    stable.warning === "ok" && stable.positive === 2,
    `warning=${stable.warning}`,
  );

  const unlabeled = relationshipHealthFromLabels([null, null]);
  check(
    "unscored notes keep the pulse empty",
    unlabeled.sampleSize === 0 && unlabeled.unlabeled === 2,
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(
    `\n${checks.length - failed.length}/${checks.length} passed` +
      (failed.length ? ` — ${failed.length} failed` : ""),
  );
  if (failed.length) process.exit(1);
}

main();
