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
