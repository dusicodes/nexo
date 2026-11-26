/**
 * Carried-over Tasks (GLOSSARY.md): open Tasks whose Planned day is before
 * today. Free of the database so the Today page shares these rules with the
 * Tasks module.
 */
import type { LocalDate } from "./local-date";

type TaskDays = { plannedDay: LocalDate; completedDay: LocalDate | null };

/**
 * True when Today shows `task` on `today`: open and planned for today or
 * earlier, or done on today. The Tasks module's `today` query is this rule.
 */
export function isOnToday(task: TaskDays, today: LocalDate): boolean {
  return task.completedDay === null ? task.plannedDay <= today : task.completedDay === today;
}

/** True when `task` is open and was planned for a day before `today`. */
export function isCarriedOver(task: TaskDays, today: LocalDate): boolean {
  return task.completedDay === null && task.plannedDay < today;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `from` to `to`; calendar arithmetic, so no time zone or DST. */
function daysBetween(from: LocalDate, to: LocalDate): number {
  const utc = (day: LocalDate) => Date.parse(`${day}T00:00:00Z`);
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/**
 * The small hint a Carried-over Task shows of its Planned day: the weekday
 * ("from Tuesday") within the last week, otherwise a short date, with the
 * year when it is not this year. `locale` defaults to the runtime's own.
 */
export function plannedDayHint(
  plannedDay: LocalDate,
  today: LocalDate,
  locale?: string,
): string {
  // Format at UTC noon of the day, so no time zone can move it to a neighbour.
  const day = new Date(`${plannedDay}T12:00:00Z`);
  const options: Intl.DateTimeFormatOptions =
    daysBetween(plannedDay, today) < 7
      ? { weekday: "long" }
      : plannedDay.slice(0, 4) === today.slice(0, 4)
        ? { day: "numeric", month: "short" }
        : { day: "numeric", month: "short", year: "numeric" };
  return `from ${new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(day)}`;
}
