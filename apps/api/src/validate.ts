// apps/api/src/validate.ts

export type PreservationIssue =
  | { type: "missing_anchor"; message: string; details?: any }
  | { type: "extra_anchor"; message: string; details?: any };

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export function extractAnchors(text: string) {
  const percents = text.match(/\b\d+(\.\d+)?%\b/g) ?? [];
  const years = text.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/g) ?? [];
  const money = text.match(/\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g) ?? [];
  const numbers = text.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g) ?? [];
  const monthDates =
    text.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/g
    ) ?? [];

  // Basic proper-noun-ish anchors: 2+ Capitalized words
  const names = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [];

  return {
    percents: uniq(percents),
    years: uniq(years),
    money: uniq(money),
    monthDates: uniq(monthDates),
    numbers: uniq(numbers),
    names: uniq(names),
  };
}

export function validatePreservation(original: string, rewritten: string) {
  const o = extractAnchors(original);
  const r = extractAnchors(rewritten);

  const issues: PreservationIssue[] = [];

  const required = [
    ...o.percents.map((v) => ({ kind: "percent", v })),
    ...o.years.map((v) => ({ kind: "year", v })),
    ...o.money.map((v) => ({ kind: "money", v })),
    ...o.monthDates.map((v) => ({ kind: "date", v })),
    ...o.numbers.map((v) => ({ kind: "number", v })),
    ...o.names.map((v) => ({ kind: "name", v })),
  ];

  // Must contain all original anchors
  for (const a of required) {
    if (!rewritten.includes(a.v)) {
      issues.push({
        type: "missing_anchor",
        message: `Missing required ${a.kind} anchor: "${a.v}"`,
        details: a,
      });
    }
  }

  // Must not introduce new numeric/date-like anchors
  const origNumeric = new Set([...o.percents, ...o.years, ...o.money, ...o.monthDates, ...o.numbers]);
  const rewNumeric = uniq([...r.percents, ...r.years, ...r.money, ...r.monthDates, ...r.numbers]);

  const extras = rewNumeric.filter((x) => !origNumeric.has(x));
  if (extras.length) {
    issues.push({
      type: "extra_anchor",
      message: `Introduced new numeric/date tokens not in original: ${extras.join(", ")}`,
      details: { extras },
    });
  }

  return { ok: issues.length === 0, issues, anchors: o };
}
