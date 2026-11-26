import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { isLocalDate, type LocalDate } from "./local-date";

/**
 * The Tasks module: the only code that reads or writes Tasks (GLOSSARY.md).
 * The Today page and, later, the assistant's tools both go through it, so the
 * rules for Today live here and nowhere else.
 *
 * "Today" is always passed in as the user's local calendar day (LocalDate),
 * sent by the browser, so the day changes at the user's own midnight and the
 * server never guesses a time zone.
 */

/** A Task as Today shows it. */
export type TodayTask = {
  id: string;
  title: string;
  plannedDay: LocalDate;
};

function toTodayTask(row: typeof tasks.$inferSelect): TodayTask {
  return { id: row.id, title: row.title, plannedDay: row.plannedDay };
}

function assertLocalDate(value: unknown): asserts value is LocalDate {
  if (!isLocalDate(value)) {
    throw new Error(`Not a local date (YYYY-MM-DD): ${String(value)}`);
  }
}

/** Thrown when a Task would be saved without a title. */
export class BlankTaskTitleError extends Error {
  constructor() {
    super("A Task needs a title.");
    this.name = "BlankTaskTitleError";
  }
}

function cleanTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === "") {
    throw new BlankTaskTitleError();
  }
  return trimmed;
}

/** Adds an open Task planned for `localDate`. */
export async function add(title: string, localDate: LocalDate): Promise<TodayTask> {
  assertLocalDate(localDate);
  const [created] = await getDb()
    .insert(tasks)
    .values({ title: cleanTitle(title), plannedDay: localDate })
    .returning();
  return toTodayTask(created);
}

/** What Today shows for `localDate`, oldest (first added) first. */
export async function today(localDate: LocalDate): Promise<TodayTask[]> {
  assertLocalDate(localDate);
  const rows = await getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.plannedDay, localDate))
    .orderBy(asc(tasks.seq));
  return rows.map(toTodayTask);
}
