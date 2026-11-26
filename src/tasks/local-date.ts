/**
 * Local calendar days, shared by the Tasks module and the browser. Free of
 * the database so client code can import it.
 */

/** A local calendar day, `YYYY-MM-DD`. */
export type LocalDate = string;

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a real calendar day written as `YYYY-MM-DD`. */
export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string" || !LOCAL_DATE.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Midnight at the start of `localDate`, in the runtime's own time zone. */
export function startOfLocalDate(localDate: LocalDate): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** The calendar day `instant` falls on in the runtime's own time zone. */
export function toLocalDate(instant: Date): LocalDate {
  const year = String(instant.getFullYear()).padStart(4, "0");
  const month = String(instant.getMonth() + 1).padStart(2, "0");
  const day = String(instant.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
