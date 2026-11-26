"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { startOfLocalDate, toLocalDate, type LocalDate } from "@/tasks/local-date";
import type { TodayTask } from "@/tasks/tasks";
import { addTask, loadToday } from "./today-actions";

/**
 * Today: a calm, Notion-style page where every line is a Task. The browser
 * owns "today": it works out the local day and sends it with every call, so
 * the page renders only once mounted and moves to the next day by itself at
 * local midnight.
 */

// Rechecks the local day every half minute, and whenever the tab comes back
// into view (background tabs throttle timers), so the page follows midnight.
function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

const currentLocalDate = () => toLocalDate(new Date());

function useLocalDate(): LocalDate | null {
  return useSyncExternalStore(subscribeToClock, currentLocalDate, () => null);
}

function formatHeading(localDate: LocalDate): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(startOfLocalDate(localDate));
}

/** A Task on the page; `saving` until the server has confirmed it. */
type ShownTask = TodayTask & { saving?: boolean };

/** The Tasks on the page and the day they were loaded for. */
type ShownDay = { day: LocalDate; tasks: ShownTask[] };

export function Today() {
  const localDate = useLocalDate();
  const [shown, setShown] = useState<ShownDay | null>(null);
  const [reloads, setReloads] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const newLine = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localDate === null) {
      return;
    }
    let current = true;
    loadToday(localDate).then(
      (tasks) => {
        if (current) {
          setShown({ day: localDate, tasks });
          setError(null);
        }
      },
      () => {
        if (current) {
          setError("Couldn't load Today. Reload to try again.");
        }
      },
    );
    return () => {
      current = false;
    };
  }, [localDate, reloads]);

  if (localDate === null) {
    return null;
  }

  // Changes the shown Tasks only if they are still the ones for `day`.
  const updateShownTasks = (day: LocalDate, change: (tasks: ShownTask[]) => ShownTask[]) =>
    setShown((previous) =>
      previous?.day === day ? { day, tasks: change(previous.tasks) } : previous,
    );

  const save = (title: string) => {
    if (title.trim() === "") {
      return;
    }
    // Read the clock now, not the last tick, so a Task written just after
    // midnight belongs to the new day.
    const day = currentLocalDate();
    const placeholderId = `saving-${crypto.randomUUID()}`;
    setDraft("");
    setError(null);
    updateShownTasks(day, (tasks) => [
      ...tasks,
      { id: placeholderId, title: title.trim(), plannedDay: day, saving: true },
    ]);
    addTask(title, day).then(
      (task) => {
        if (shown?.day !== day) {
          // The page was still showing another day; load the new one so the
          // Task appears.
          setReloads((count) => count + 1);
          return;
        }
        updateShownTasks(day, (tasks) =>
          tasks.map((shownTask) => (shownTask.id === placeholderId ? task : shownTask)),
        );
      },
      () => {
        updateShownTasks(day, (tasks) => tasks.filter((shownTask) => shownTask.id !== placeholderId));
        setDraft((current) => (current === "" ? title : current));
        setError("Couldn't save that Task. Try again.");
      },
    );
  };

  // Until the first load the list is not shown; after that the last loaded
  // Tasks stay on the page while a new day loads, so the new line keeps focus.
  const tasks = shown?.tasks ?? null;

  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-1 cursor-text flex-col px-6 pt-10 pb-24 sm:pt-16"
      aria-busy={shown?.day !== localDate}
      onClick={(event) => {
        // Clicking anywhere on the page that is not a control writes on the
        // new line.
        if (!(event.target as HTMLElement).closest("input, button, a")) {
          newLine.current?.focus();
        }
      }}
    >
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Today
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{formatHeading(localDate)}</h1>

      {tasks !== null && (
        <ul className="mt-8 flex flex-col" aria-label="Tasks">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-start gap-3 py-1 transition-opacity",
                task.saving && "opacity-60",
              )}
            >
              <TaskBox />
              <span className="min-w-0 flex-1 text-base leading-7 break-words">{task.title}</span>
            </li>
          ))}
          <li className="flex items-start gap-3 py-1">
            <TaskBox faint />
            <input
              ref={newLine}
              value={draft}
              aria-label="New Task"
              placeholder={tasks.length === 0 ? "Write a Task…" : "New Task"}
              autoFocus={tasks.length === 0}
              className="min-w-0 flex-1 bg-transparent text-base leading-7 outline-none placeholder:text-muted-foreground/60"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  save(draft);
                }
              }}
              // Autosave: text left on the new line is saved when it loses
              // focus (after a failed save this retries it); a blank line is
              // never saved.
              onBlur={() => save(draft)}
            />
          </li>
        </ul>
      )}

      {error !== null && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </main>
  );
}

/** The checkbox square in front of each line; it becomes interactive with completing Tasks. */
function TaskBox({ faint = false }: { faint?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-1.5 size-4 shrink-0 rounded-[5px] border border-muted-foreground/50",
        faint && "border-dashed border-muted-foreground/30",
      )}
    />
  );
}
