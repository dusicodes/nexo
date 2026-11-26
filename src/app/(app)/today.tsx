"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { Trash2 } from "lucide-react";
import { startOfLocalDate, toLocalDate, type LocalDate } from "@/tasks/local-date";
import type { TaskSnapshot, TodayTask } from "@/tasks/tasks";
import { addTask, deleteTask, loadToday, renameTask, restoreTask } from "./today-actions";

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

/** How long the "Task deleted · Undo" toast stays up. */
const UNDO_MS = 5_000;

/** How long typing in a title pauses before it is saved. */
const AUTOSAVE_MS = 500;

/** A delete that can still be undone; the snapshot arrives once the server has deleted it. */
type Undoable = { snapshot: Promise<TaskSnapshot> };

export function Today() {
  const localDate = useLocalDate();
  const [shown, setShown] = useState<ShownDay | null>(null);
  const [reloads, setReloads] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [undoable, setUndoable] = useState<Undoable | null>(null);
  const newLine = useRef<HTMLInputElement>(null);
  // Saves for one Task run one after another, so a delete always sees the
  // title typed just before it, and its snapshot is what the user last saw.
  const queues = useRef(new Map<string, Promise<unknown>>());

  useEffect(() => {
    if (undoable === null) {
      return;
    }
    const timer = window.setTimeout(() => setUndoable(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undoable]);

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
      { id: placeholderId, title: title.trim(), plannedDay: day, seq: Infinity, saving: true },
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

  const enqueue = <T,>(id: string, run: () => Promise<T>): Promise<T> => {
    const next = (queues.current.get(id) ?? Promise.resolve()).catch(() => {}).then(run);
    queues.current.set(id, next);
    return next;
  };

  // Changes whichever Tasks are shown; ids are unique across days.
  const updateTasks = (change: (tasks: ShownTask[]) => ShownTask[]) =>
    setShown((previous) => previous && { ...previous, tasks: change(previous.tasks) });

  const insertAt = (index: number, task: ShownTask) =>
    updateTasks((tasks) => [...tasks.slice(0, index), task, ...tasks.slice(index)]);

  // Puts a Task back in Today's order (by seq); lines still saving stay last.
  const insertInOrder = (task: ShownTask) =>
    updateTasks((tasks) => {
      const after = tasks.findIndex((shownTask) => shownTask.saving || shownTask.seq > task.seq);
      const index = after === -1 ? tasks.length : after;
      return [...tasks.slice(0, index), task, ...tasks.slice(index)];
    });

  const saveTitle = (id: string, title: string) => {
    setError(null);
    updateTasks((tasks) => tasks.map((task) => (task.id === id ? { ...task, title } : task)));
    enqueue(id, () => renameTask(id, title)).catch(() =>
      setError("Couldn't save that title. Try again."),
    );
  };

  // Takes the Task off the page at once and deletes it on the server.
  const deleteFromPage = (task: ShownTask): Promise<TaskSnapshot> | null => {
    const index = shown?.tasks.findIndex((shownTask) => shownTask.id === task.id) ?? -1;
    if (index === -1) {
      return null;
    }
    setError(null);
    updateTasks((tasks) => tasks.filter((shownTask) => shownTask.id !== task.id));
    const deleted = enqueue(task.id, () => deleteTask(task.id));
    deleted.catch(() => {
      setUndoable(null);
      insertAt(index, task);
      setError("Couldn't delete that Task. Try again.");
    });
    return deleted;
  };

  // The delete icon: offers the "Task deleted · Undo" toast straight away.
  const deleteWithUndo = (task: ShownTask) => {
    const snapshot = deleteFromPage(task);
    if (snapshot !== null) {
      setUndoable({ snapshot });
    }
  };

  // Backspace on an emptied title: the Task goes silently.
  const deleteSilently = (task: ShownTask) => {
    deleteFromPage(task);
  };

  const undoDelete = ({ snapshot }: Undoable) => {
    setUndoable(null);
    snapshot.then(restoreTask).then(
      (task) => {
        if (shown?.day === task.plannedDay) {
          insertInOrder(task);
        }
      },
      () => setError("Couldn't bring that Task back."),
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
            <TaskLine
              key={task.id}
              task={task}
              onTitleChange={(title) => saveTitle(task.id, title)}
              onDelete={() => deleteWithUndo(task)}
              onEmptied={() => {
                deleteSilently(task);
                newLine.current?.focus();
              }}
            />
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

      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-6"
      >
        {undoable !== null && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
            <span>Task deleted</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              className="font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              onClick={() => undoDelete(undoable)}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * One Task line. Clicking the title edits it in place: typing autosaves after
 * a short pause and on leaving the line, Esc puts back the title from before
 * the edit, and Backspace on an emptied title removes the Task. A blank title
 * is never saved; leaving one blank restores the previous title.
 */
function TaskLine({
  task,
  onTitleChange,
  onDelete,
  onEmptied,
}: {
  task: ShownTask;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onEmptied: () => void;
}) {
  const [edit, setEdit] = useState<{ original: string; value: string } | null>(null);
  const lastSavedTitle = useRef(task.title);
  const editEnded = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const titleButton = useRef<HTMLButtonElement>(null);

  // A title still waiting for its autosave when the line goes away (the day
  // changes, the page navigates) is saved rather than dropped.
  const pendingSave = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      pendingSave.current?.();
    },
    [],
  );

  const save = (value: string) => {
    window.clearTimeout(timer.current);
    pendingSave.current = null;
    const title = value.trim();
    if (title !== "" && title !== lastSavedTitle.current) {
      lastSavedTitle.current = title;
      onTitleChange(title);
    }
  };

  const startEditing = () => {
    lastSavedTitle.current = task.title;
    editEnded.current = false;
    setEdit({ original: task.title, value: task.title });
  };

  // Ends the edit once, keeping `value` (or the original title if it is blank).
  const endEditing = (value: string, { refocus }: { refocus: boolean }) => {
    if (edit === null || editEnded.current) {
      return;
    }
    editEnded.current = true;
    save(value.trim() === "" ? edit.original : value);
    setEdit(null);
    if (refocus) {
      requestAnimationFrame(() => titleButton.current?.focus());
    }
  };

  return (
    <li
      className={cn(
        "group flex items-start gap-3 py-1 transition-opacity",
        task.saving && "opacity-60",
      )}
    >
      <TaskBox />
      {edit === null ? (
        <button
          ref={titleButton}
          type="button"
          disabled={task.saving}
          aria-label={`Edit Task: ${task.title}`}
          className="min-w-0 flex-1 cursor-text text-left text-base leading-7 break-words outline-none"
          onClick={startEditing}
        >
          {task.title}
        </button>
      ) : (
        <input
          value={edit.value}
          aria-label="Task title"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-base leading-7 outline-none"
          onFocus={(event) => {
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
          }}
          onChange={(event) => {
            const value = event.target.value;
            setEdit({ ...edit, value });
            window.clearTimeout(timer.current);
            pendingSave.current = () => save(value);
            timer.current = window.setTimeout(() => save(value), AUTOSAVE_MS);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              endEditing(edit.original, { refocus: true });
            } else if (event.key === "Enter") {
              event.preventDefault();
              endEditing(edit.value, { refocus: true });
            } else if (event.key === "Backspace" && edit.value === "") {
              event.preventDefault();
              window.clearTimeout(timer.current);
              pendingSave.current = null;
              editEnded.current = true;
              onEmptied();
            }
          }}
          onBlur={() => endEditing(edit.value, { refocus: false })}
        />
      )}
      {!task.saving && (
        <button
          type="button"
          aria-label={`Delete Task: ${task.title}`}
          className="mt-1 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      )}
    </li>
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
