import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tasks } from "@/db/schema";
import { normaliseDetails, tickChecklistItem } from "./details";
import { isLocalDate, type LocalDate } from "./local-date";

export { NotAChecklistItemError } from "./details";

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
  /** Plain text under the title, exactly as typed; empty when there are none. */
  details: string;
  plannedDay: LocalDate;
  /** The local day the Task was completed; null while it is open. */
  completedDay: LocalDate | null;
  /** Where the Task stands: Today lists Tasks by ascending seq. */
  seq: number;
};

function toTodayTask(row: TaskSnapshot): TodayTask {
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    plannedDay: row.plannedDay,
    completedDay: row.completedDay,
    seq: row.seq,
  };
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

/** Thrown when an id names no stored Task. */
export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`No Task with id ${id}.`);
    this.name = "TaskNotFoundError";
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

/**
 * What Today shows for `localDate`: the open Tasks planned for it, then the
 * Tasks completed on it, each group oldest (first added) first. A done Task
 * leaves Today when the day ends but stays stored.
 */
export async function today(localDate: LocalDate): Promise<TodayTask[]> {
  assertLocalDate(localDate);
  const rows = await getDb()
    .select()
    .from(tasks)
    .where(
      or(
        and(eq(tasks.plannedDay, localDate), isNull(tasks.completedDay)),
        eq(tasks.completedDay, localDate),
      ),
    )
    .orderBy(sql`${tasks.completedDay} is not null`, asc(tasks.seq));
  return rows.map(toTodayTask);
}

/** Gives a Task a new title. */
export async function rename(id: string, title: string): Promise<TodayTask> {
  const [renamed] = await getDb()
    .update(tasks)
    .set({ title: cleanTitle(title), updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  if (renamed === undefined) {
    throw new TaskNotFoundError(id);
  }
  return toTodayTask(renamed);
}

/**
 * Replaces a Task's Details. They are kept exactly as typed, blank included,
 * except that a line starting with "[ ] " is saved as a "[] " Checklist item.
 */
export async function setDetails(id: string, details: string): Promise<TodayTask> {
  const [updated] = await getDb()
    .update(tasks)
    .set({ details: normaliseDetails(details), updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  if (updated === undefined) {
    throw new TaskNotFoundError(id);
  }
  return toTodayTask(updated);
}

/** Marks a Task done on `localDate`. Its Details, Checklist items included, stay as they are. */
export async function complete(id: string, localDate: LocalDate): Promise<TodayTask> {
  assertLocalDate(localDate);
  const [completed] = await getDb()
    .update(tasks)
    .set({ completedDay: localDate, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  if (completed === undefined) {
    throw new TaskNotFoundError(id);
  }
  return toTodayTask(completed);
}

/** Reopens a done Task, putting it back among the open Tasks in its old place. */
export async function reopen(id: string): Promise<TodayTask> {
  const [reopened] = await getDb()
    .update(tasks)
    .set({ completedDay: null, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  if (reopened === undefined) {
    throw new TaskNotFoundError(id);
  }
  return toTodayTask(reopened);
}

/**
 * Ticks or unticks the Checklist item on line `lineIndex` (from 0) of a Task's
 * Details, rewriting only that line's marker. It refuses a line that is not a
 * Checklist item, and never completes or reopens the Task.
 */
export async function setChecklistItem(
  id: string,
  lineIndex: number,
  ticked: boolean,
): Promise<TodayTask> {
  // Read and write in one transaction, so a Details save cannot land between them.
  return getDb().transaction(async (tx) => {
    const [task] = await tx.select().from(tasks).where(eq(tasks.id, id)).for("update");
    if (task === undefined) {
      throw new TaskNotFoundError(id);
    }
    const [updated] = await tx
      .update(tasks)
      .set({ details: tickChecklistItem(task.details, lineIndex, ticked), updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return toTodayTask(updated);
  });
}

/**
 * Everything stored about a Task, as `delete` returns it. Handing it to
 * `restore` puts the Task back exactly as it was: same id, fields and place.
 */
export type TaskSnapshot = typeof tasks.$inferSelect;

/** Deletes a Task and returns its snapshot, so the delete can be undone. */
async function deleteTask(id: string): Promise<TaskSnapshot> {
  const [deleted] = await getDb().delete(tasks).where(eq(tasks.id, id)).returning();
  if (deleted === undefined) {
    throw new TaskNotFoundError(id);
  }
  return deleted;
}

// `delete` is a reserved word, so it cannot name a function declaration.
export { deleteTask as delete };

/**
 * Puts a deleted Task back from its snapshot. The snapshot may have travelled
 * through the browser, so it is checked like any other input.
 */
export async function restore(snapshot: TaskSnapshot): Promise<TodayTask> {
  const [restored] = await getDb().insert(tasks).values(checkSnapshot(snapshot)).returning();
  return toTodayTask(restored);
}

function checkSnapshot(snapshot: TaskSnapshot): TaskSnapshot {
  const { id, seq, title, details, plannedDay, completedDay, createdAt, updatedAt } = snapshot;
  if (
    typeof id !== "string" ||
    !Number.isSafeInteger(seq) ||
    typeof title !== "string" ||
    typeof details !== "string" ||
    !(createdAt instanceof Date) ||
    !(updatedAt instanceof Date)
  ) {
    throw new Error("Not a Task snapshot.");
  }
  assertLocalDate(plannedDay);
  if (completedDay !== null) {
    assertLocalDate(completedDay);
  }
  return {
    id,
    seq,
    title: cleanTitle(title),
    details,
    plannedDay,
    completedDay,
    createdAt,
    updatedAt,
  };
}
