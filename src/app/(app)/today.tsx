"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { Trash2 } from "lucide-react";
import { normaliseDetails, readDetails, tickChecklistItem } from "@/tasks/details";
import { startOfLocalDate, toLocalDate, type LocalDate } from "@/tasks/local-date";
import type { TaskSnapshot, TodayTask } from "@/tasks/tasks";
import { DetailsText } from "./details-text";
import {
  addTask,
  deleteTask,
  loadToday,
  renameTask,
  restoreTask,
  setTaskChecklistItem,
  setTaskDetails,
} from "./today-actions";

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

/** How long typing in a title or Details pauses before it is saved. */
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
  // A Task just added with Shift+Enter, whose Details open once it is saved.
  const [openDetailsOf, setOpenDetailsOf] = useState<string | null>(null);
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

  const save = (title: string, { openDetails = false } = {}) => {
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
      {
        id: placeholderId,
        title: title.trim(),
        details: "",
        plannedDay: day,
        seq: Infinity,
        saving: true,
      },
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
        // Shift+Enter asked for Details; open them unless the user has
        // already moved on to writing the next Task.
        if (
          openDetails &&
          document.activeElement === newLine.current &&
          newLine.current?.value === ""
        ) {
          setOpenDetailsOf(task.id);
        }
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

  const saveDetails = (id: string, details: string) => {
    setError(null);
    updateTasks((tasks) => tasks.map((task) => (task.id === id ? { ...task, details } : task)));
    enqueue(id, () => setTaskDetails(id, details)).catch(() =>
      setError("Couldn't save those Details. Try again."),
    );
  };

  // Ticks or unticks a Checklist item on the page at once, then on the server;
  // if that fails, the line goes back to how it was (unless it has since been
  // edited into something that is no longer a Checklist item).
  const tickItem = (id: string, lineIndex: number, ticked: boolean) => {
    const retick = (to: boolean) =>
      updateTasks((tasks) =>
        tasks.map((task) => {
          if (task.id !== id || readDetails(task.details)[lineIndex]?.kind !== "checklist") {
            return task;
          }
          return { ...task, details: tickChecklistItem(task.details, lineIndex, to) };
        }),
      );
    setError(null);
    retick(ticked);
    enqueue(id, () => setTaskChecklistItem(id, lineIndex, ticked)).catch(() => {
      retick(!ticked);
      setError("Couldn't save that Checklist item. Try again.");
    });
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

  // Backspace on an emptied title: the Task goes silently, unless it still
  // has Details, which would be lost, so then it offers Undo.
  const deleteEmptied = (task: ShownTask) => {
    if (task.details.trim() === "") {
      deleteFromPage(task);
    } else {
      deleteWithUndo(task);
    }
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
        const target = event.target as HTMLElement;
        if (!target.closest("input, textarea, button, a, [data-details]")) {
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
              openDetails={openDetailsOf === task.id}
              onDetailsOpened={() => setOpenDetailsOf(null)}
              onTitleChange={(title) => saveTitle(task.id, title)}
              onDetailsChange={(details) => saveDetails(task.id, details)}
              onChecklistItemTick={(lineIndex, ticked) => tickItem(task.id, lineIndex, ticked)}
              onDelete={() => deleteWithUndo(task)}
              onEmptied={() => {
                deleteEmptied(task);
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
                  save(draft, { openDetails: event.shiftKey });
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
 * Saves a value after typing pauses, at once when asked, and on unmount if a
 * save is still waiting (the day changes, the page navigates), so nothing
 * typed is dropped. A value equal to the last one saved is not sent again.
 */
function useAutosave(commit: (value: string) => void, saved: string) {
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<(() => void) | null>(null);
  const lastSaved = useRef(saved);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      pending.current?.();
    },
    [],
  );

  const cancel = () => {
    window.clearTimeout(timer.current);
    pending.current = null;
  };

  const saveNow = (value: string) => {
    cancel();
    if (value !== lastSaved.current) {
      lastSaved.current = value;
      commit(value);
    }
  };

  return {
    /** Starts an edit of a value currently saved as `saved`. */
    start: (saved: string) => {
      lastSaved.current = saved;
    },
    schedule: (value: string) => {
      cancel();
      const run = () => saveNow(value);
      pending.current = run;
      timer.current = window.setTimeout(run, AUTOSAVE_MS);
    },
    saveNow,
    cancel,
  };
}

/** An edit in progress: the text from before it, and the text now. */
type Edit = { original: string; value: string };

/**
 * Where in the Details text a click on one of its shown lines landed, so the
 * editor opens with the caret there. A Checklist item's marker is hidden, so
 * its length is added back. Undefined when the click is not on a line.
 */
function caretAtClick(event: React.MouseEvent, details: string): number | undefined {
  const lineElement = (event.target as HTMLElement).closest<HTMLElement>("[data-line]");
  if (lineElement === null) {
    return undefined;
  }
  const lineIndex = Number(lineElement.dataset.line);
  const lines = details.split("\n");
  const rawLine = lines[lineIndex] ?? "";
  const shownText = readDetails(rawLine)[0].text;
  const lineStart = lines.slice(0, lineIndex).reduce((sum, line) => sum + line.length + 1, 0);
  const textElement = lineElement.querySelector<HTMLElement>("[data-line-text]") ?? lineElement;
  // Beside the text (past its end, or on the checkbox gap) goes to the line's end.
  const within = offsetAtPoint(textElement, event.clientX, event.clientY) ?? shownText.length;
  return lineStart + (rawLine.length - shownText.length) + Math.min(within, shownText.length);
}

/** How many characters of `element`'s text lie before the point, if the point is in it. */
function offsetAtPoint(element: HTMLElement, x: number, y: number): number | undefined {
  let node: Node;
  let offset: number;
  if (typeof document.caretPositionFromPoint === "function") {
    const position = document.caretPositionFromPoint(x, y);
    if (position === null) {
      return undefined;
    }
    ({ offsetNode: node, offset } = position);
  } else {
    // WebKit (Safari, and Tauri on macOS) only has the older caretRangeFromPoint.
    const range = document.caretRangeFromPoint(x, y);
    if (range === null) {
      return undefined;
    }
    ({ startContainer: node, startOffset: offset } = range);
  }
  if (!element.contains(node)) {
    return undefined;
  }
  const before = document.createRange();
  before.setStart(element, 0);
  before.setEnd(node, offset);
  return before.toString().length;
}

/** Grows a textarea to fit its text, wrapped lines included. */
function fitHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * One Task line. Clicking the title edits it in place: typing autosaves after
 * a short pause and on leaving the line, Esc puts back the title from before
 * the edit, and Backspace on an emptied title removes the Task. A blank title
 * is never saved; leaving one blank restores the previous title.
 *
 * Shift+Enter in the title starts a new line of Details, shown muted under
 * the title. Details autosave the same way and are kept exactly as typed;
 * Shift+Enter in them starts another line, Enter or Esc ends the edit (Esc
 * putting back the Details from before it), and Backspace in empty Details
 * returns to the title.
 *
 * A Details line starting with "[] " (or "[ ] ") shows as a Checklist item
 * with its own checkbox once the edit ends; "[x] " is a ticked one. Ticking
 * one only rewrites that line; the Task itself stays open.
 */
function TaskLine({
  task,
  openDetails,
  onDetailsOpened,
  onTitleChange,
  onDetailsChange,
  onChecklistItemTick,
  onDelete,
  onEmptied,
}: {
  task: ShownTask;
  /** Opens the Details editor when the line first appears. */
  openDetails: boolean;
  onDetailsOpened: () => void;
  onTitleChange: (title: string) => void;
  onDetailsChange: (details: string) => void;
  onChecklistItemTick: (lineIndex: number, ticked: boolean) => void;
  onDelete: () => void;
  onEmptied: () => void;
}) {
  const [titleEdit, setTitleEdit] = useState<Edit | null>(null);
  const [detailsEdit, setDetailsEdit] = useState<Edit | null>(() =>
    openDetails ? { original: task.details, value: task.details } : null,
  );
  const titleEditEnded = useRef(false);
  const detailsEditEnded = useRef(false);
  const detailsCaret = useRef<number | null>(null);
  const titleButton = useRef<HTMLButtonElement>(null);
  const titleSave = useAutosave(onTitleChange, task.title);
  const detailsSave = useAutosave(onDetailsChange, task.details);

  const startTitleEditing = () => {
    titleSave.start(task.title);
    titleEditEnded.current = false;
    setTitleEdit({ original: task.title, value: task.title });
  };

  // Ends the title edit once, keeping `value` (or the original title if it is blank).
  const endTitleEditing = (value: string, { refocus }: { refocus: boolean }) => {
    if (titleEdit === null || titleEditEnded.current) {
      return;
    }
    titleEditEnded.current = true;
    titleSave.saveNow(value.trim() === "" ? titleEdit.original : value.trim());
    setTitleEdit(null);
    if (refocus) {
      requestAnimationFrame(() => titleButton.current?.focus());
    }
  };

  // Opens Details for editing. The caret goes at `caret` (where a click on the
  // Details landed), else at the end, on a fresh line below what is already
  // there when `newLine` is set (Shift+Enter in the title).
  const startDetailsEditing = ({ newLine, caret }: { newLine: boolean; caret?: number }) => {
    const value = newLine && task.details !== "" ? `${task.details}\n` : task.details;
    detailsCaret.current = caret ?? null;
    detailsSave.start(task.details);
    detailsEditEnded.current = false;
    setDetailsEdit({ original: task.details, value });
  };

  // Ends the Details edit once. Empty lines left at the end (from Shift+Enter
  // with nothing typed after it) are dropped, and "[ ] " becomes "[] " as the
  // Tasks module saves it; everything else stays as typed.
  const endDetailsEditing = (value: string, { refocus }: { refocus: boolean }) => {
    if (detailsEdit === null || detailsEditEnded.current) {
      return;
    }
    detailsEditEnded.current = true;
    detailsSave.saveNow(normaliseDetails(value.replace(/\n+$/, "")));
    setDetailsEdit(null);
    if (refocus) {
      requestAnimationFrame(() => titleButton.current?.focus());
    }
  };

  // The Details as the page shows them: what is being typed, else what is saved.
  const details = detailsEdit?.value ?? task.details;

  return (
    <li
      className={cn(
        "group flex items-start gap-3 py-1 transition-opacity",
        task.saving && "opacity-60",
      )}
    >
      <TaskBox />
      <div className="min-w-0 flex-1">
        {titleEdit === null ? (
          <button
            ref={titleButton}
            type="button"
            disabled={task.saving}
            aria-label={`Edit Task: ${task.title}`}
            className="block w-full cursor-text text-left text-base leading-7 break-words outline-none"
            onClick={startTitleEditing}
          >
            {task.title}
          </button>
        ) : (
          <input
            value={titleEdit.value}
            aria-label="Task title"
            autoFocus
            className="block w-full bg-transparent text-base leading-7 outline-none"
            onFocus={(event) => {
              const end = event.target.value.length;
              event.target.setSelectionRange(end, end);
            }}
            onChange={(event) => {
              const value = event.target.value;
              setTitleEdit({ ...titleEdit, value });
              if (value.trim() === "") {
                titleSave.cancel();
              } else {
                titleSave.schedule(value.trim());
              }
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) {
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                endTitleEditing(titleEdit.original, { refocus: true });
              } else if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault();
                endTitleEditing(titleEdit.value, { refocus: false });
                startDetailsEditing({ newLine: true });
              } else if (event.key === "Enter") {
                event.preventDefault();
                endTitleEditing(titleEdit.value, { refocus: true });
              } else if (event.key === "Backspace" && titleEdit.value === "") {
                event.preventDefault();
                titleSave.cancel();
                titleEditEnded.current = true;
                onEmptied();
              }
            }}
            onBlur={() => endTitleEditing(titleEdit.value, { refocus: false })}
          />
        )}
        {detailsEdit !== null ? (
          <textarea
            value={detailsEdit.value}
            aria-label="Task Details"
            autoFocus
            rows={1}
            ref={(textarea) => {
              if (textarea !== null) {
                fitHeight(textarea);
              }
            }}
            className="block w-full resize-none bg-transparent text-sm leading-6 text-muted-foreground outline-none"
            onFocus={(event) => {
              const caret = detailsCaret.current ?? event.target.value.length;
              detailsCaret.current = null;
              event.target.setSelectionRange(caret, caret);
              onDetailsOpened();
            }}
            onChange={(event) => {
              const value = event.target.value;
              fitHeight(event.target);
              setDetailsEdit({ ...detailsEdit, value });
              detailsSave.schedule(value);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) {
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                endDetailsEditing(detailsEdit.original, { refocus: true });
              } else if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                endDetailsEditing(detailsEdit.value, { refocus: true });
              } else if (event.key === "Backspace" && detailsEdit.value === "") {
                event.preventDefault();
                endDetailsEditing("", { refocus: false });
                startTitleEditing();
              }
              // Shift+Enter is left to the textarea: it starts a new line.
            }}
            onBlur={() => endDetailsEditing(detailsEdit.value, { refocus: false })}
          />
        ) : (
          details !== "" && (
            <div
              data-details
              className="cursor-text text-sm leading-6 break-words whitespace-pre-wrap text-muted-foreground"
              onClick={(event) => {
                if (!task.saving && !(event.target as HTMLElement).closest("a, input")) {
                  startDetailsEditing({ newLine: false, caret: caretAtClick(event, details) });
                }
              }}
            >
              {readDetails(details).map((line, lineIndex) =>
                line.kind === "checklist" ? (
                  // Not a <label>: clicking the text edits the Details, only the box ticks.
                  <div key={lineIndex} data-line={lineIndex} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={line.ticked}
                      disabled={task.saving}
                      aria-label={`Checklist item: ${line.text}`}
                      className="mt-1.5 size-3.5 shrink-0 cursor-pointer accent-foreground"
                      onChange={(event) => onChecklistItemTick(lineIndex, event.target.checked)}
                    />
                    <span
                      data-line-text
                      className={cn("min-w-0", line.ticked && "line-through opacity-70")}
                    >
                      <DetailsText details={line.text} />
                    </span>
                  </div>
                ) : (
                  // An empty line keeps its height, as it did in the plain text.
                  <p key={lineIndex} data-line={lineIndex} className="min-h-6">
                    <DetailsText details={line.text} />
                  </p>
                ),
              )}
            </div>
          )
        )}
      </div>
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
