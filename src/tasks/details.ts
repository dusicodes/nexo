/**
 * Reading a Task's Details (GLOSSARY.md). Details are one text field; a line
 * starting with "[] " is an open Checklist item and one starting with "[x] "
 * a ticked one ("[ ] " is accepted for an open one). Every other line, "- "
 * lists included, is plain text. There is no separate store for Checklist
 * items, so these pure functions are the only place that knows the markers.
 * They hold no database code, so the page shares them with the Tasks module.
 */

/** One line of Details, in order: line i of the text is element i. */
export type DetailsLine =
  | { kind: "text"; text: string }
  | { kind: "checklist"; ticked: boolean; text: string };

const OPEN = "[] ";
const TICKED = "[x] ";
/** Also accepted for an open Checklist item; normaliseDetails rewrites it to "[] ". */
const OPEN_SPACED = "[ ] ";

/** Thrown when a line asked to be ticked or unticked is not a Checklist item. */
export class NotAChecklistItemError extends Error {
  constructor(lineIndex: number) {
    super(`Line ${lineIndex} of these Details is not a Checklist item.`);
    this.name = "NotAChecklistItemError";
  }
}

function normaliseLine(line: string): string {
  return line.startsWith(OPEN_SPACED) ? OPEN + line.slice(OPEN_SPACED.length) : line;
}

/** Details with each leading "[ ] " written as "[] "; nothing else changes. */
export function normaliseDetails(details: string): string {
  return details.split("\n").map(normaliseLine).join("\n");
}

function readLine(line: string): DetailsLine {
  const normalised = normaliseLine(line);
  if (normalised.startsWith(OPEN)) {
    return { kind: "checklist", ticked: false, text: normalised.slice(OPEN.length) };
  }
  if (normalised.startsWith(TICKED)) {
    return { kind: "checklist", ticked: true, text: normalised.slice(TICKED.length) };
  }
  return { kind: "text", text: line };
}

export function readDetails(details: string): DetailsLine[] {
  return details.split("\n").map(readLine);
}

/**
 * Ticks or unticks the Checklist item on line `lineIndex` (counting from 0),
 * rewriting only that line's marker. Refuses any other line.
 */
export function tickChecklistItem(details: string, lineIndex: number, ticked: boolean): string {
  const lines = details.split("\n");
  const line = Number.isInteger(lineIndex) ? lines[lineIndex] : undefined;
  const read = line === undefined ? undefined : readLine(line);
  if (read?.kind !== "checklist") {
    throw new NotAChecklistItemError(lineIndex);
  }
  lines[lineIndex] = (ticked ? TICKED : OPEN) + read.text;
  return lines.join("\n");
}
