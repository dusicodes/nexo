"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as tasks from "@/tasks/tasks";

/**
 * Server Functions behind the Today page. Each one checks the signed-in
 * session itself: Next.js documents that Server Functions are reachable by a
 * direct POST, so they must not rely on the proxy's page gate alone. They only
 * check inputs and the session; every Today rule lives in the Tasks module.
 */

async function requireSession(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    throw new Error("Not signed in.");
  }
}

export async function loadToday(localDate: string): Promise<tasks.TodayTask[]> {
  await requireSession();
  return tasks.today(localDate);
}

export async function addTask(title: string, localDate: string): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof title !== "string") {
    throw new Error("A Task title must be text.");
  }
  return tasks.add(title, localDate);
}

export async function renameTask(id: string, title: string): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof id !== "string" || typeof title !== "string") {
    throw new Error("A Task id and title must be text.");
  }
  return tasks.rename(id, title);
}

export async function setTaskDetails(id: string, details: string): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof id !== "string" || typeof details !== "string") {
    throw new Error("A Task id and its Details must be text.");
  }
  return tasks.setDetails(id, details);
}

export async function completeTask(id: string, localDate: string): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof id !== "string") {
    throw new Error("A Task id must be text.");
  }
  return tasks.complete(id, localDate);
}

export async function reopenTask(id: string): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof id !== "string") {
    throw new Error("A Task id must be text.");
  }
  return tasks.reopen(id);
}

export async function setTaskChecklistItem(
  id: string,
  lineIndex: number,
  ticked: boolean,
): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof id !== "string" || typeof lineIndex !== "number" || typeof ticked !== "boolean") {
    throw new Error("A Task id, line number and ticked state are needed.");
  }
  return tasks.setChecklistItem(id, lineIndex, ticked);
}

export async function deleteTask(id: string): Promise<tasks.TaskSnapshot> {
  await requireSession();
  if (typeof id !== "string") {
    throw new Error("A Task id must be text.");
  }
  return tasks.delete(id);
}

export async function restoreTask(snapshot: tasks.TaskSnapshot): Promise<tasks.TodayTask> {
  await requireSession();
  if (typeof snapshot !== "object" || snapshot === null) {
    throw new Error("Not a Task snapshot.");
  }
  return tasks.restore(snapshot);
}
