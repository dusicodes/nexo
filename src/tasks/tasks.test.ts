import { beforeAll, describe, expect, it } from "vitest";
import { useTestDatabase } from "@/test/test-database";

type Tasks = typeof import("./tasks");

describe("Tasks", () => {
  let tasks: Tasks;

  useTestDatabase();

  beforeAll(async () => {
    tasks = await import("./tasks");
  });

  // The database is shared by the whole file, so each test works on its own
  // day to stay independent of the others.

  it("shows a Task added today on Today", async () => {
    await tasks.add("Email the hiring manager", "2026-11-26");

    const today = await tasks.today("2026-11-26");

    expect(today.map((task) => task.title)).toEqual(["Email the hiring manager"]);
    expect(today[0].plannedDay).toBe("2026-11-26");
  });

  it("lists Today's Tasks oldest first", async () => {
    await tasks.add("First", "2026-11-27");
    await tasks.add("Second", "2026-11-27");
    await tasks.add("Third", "2026-11-27");

    const today = await tasks.today("2026-11-27");

    expect(today.map((task) => task.title)).toEqual(["First", "Second", "Third"]);
  });

  it("does not show a Task planned for another day", async () => {
    await tasks.add("Saturday's Task", "2026-11-28");

    expect(await tasks.today("2026-11-29")).toEqual([]);
  });

  it("refuses a blank title and saves nothing", async () => {
    await expect(tasks.add("   ", "2026-11-30")).rejects.toBeInstanceOf(
      tasks.BlankTaskTitleError,
    );

    expect(await tasks.today("2026-11-30")).toEqual([]);
  });

  it("trims the title it saves", async () => {
    await tasks.add("  Pay rent \n", "2026-12-01");

    const today = await tasks.today("2026-12-01");

    expect(today.map((task) => task.title)).toEqual(["Pay rent"]);
  });

  it("refuses a day that is not a local date", async () => {
    await expect(tasks.add("Pay rent", "2026-02-30")).rejects.toThrow("Not a local date");
    await expect(tasks.today("26/11/2026")).rejects.toThrow("Not a local date");
  });

  it("renames a Task, trimming the new title", async () => {
    const task = await tasks.add("Email the hiring maneger", "2026-12-02");

    const renamed = await tasks.rename(task.id, "  Email the hiring manager ");

    expect(renamed.title).toBe("Email the hiring manager");
    expect((await tasks.today("2026-12-02")).map((shown) => shown.title)).toEqual([
      "Email the hiring manager",
    ]);
  });

  it("refuses to rename a Task to a blank title and keeps the old one", async () => {
    const task = await tasks.add("Pay rent", "2026-12-03");

    await expect(tasks.rename(task.id, "  ")).rejects.toBeInstanceOf(tasks.BlankTaskTitleError);

    expect((await tasks.today("2026-12-03")).map((shown) => shown.title)).toEqual(["Pay rent"]);
  });

  it("refuses to rename a Task that does not exist", async () => {
    await expect(tasks.rename("no-such-task", "Pay rent")).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });

  it("deletes a Task from Today", async () => {
    await tasks.add("Keep", "2026-12-04");
    const doomed = await tasks.add("Delete me", "2026-12-04");

    await tasks.delete(doomed.id);

    expect((await tasks.today("2026-12-04")).map((shown) => shown.title)).toEqual(["Keep"]);
  });

  it("restores a deleted Task identically, in its old place", async () => {
    await tasks.add("First", "2026-12-05");
    const middle = await tasks.add("Middle", "2026-12-05");
    await tasks.add("Last", "2026-12-05");
    const before = await tasks.today("2026-12-05");

    const snapshot = await tasks.delete(middle.id);
    await tasks.add("Added while deleted", "2026-12-05");
    await tasks.restore(snapshot);

    expect(await tasks.today("2026-12-05")).toEqual([
      before[0],
      before[1],
      before[2],
      expect.objectContaining({ title: "Added while deleted" }),
    ]);
    // The snapshot carries every stored field, so deleting again gives the same one.
    expect(await tasks.delete(middle.id)).toEqual(snapshot);
  });

  it("refuses to delete a Task that does not exist", async () => {
    await expect(tasks.delete("no-such-task")).rejects.toBeInstanceOf(tasks.TaskNotFoundError);
  });
  it("stores a Task's Details exactly as typed and shows them on Today", async () => {
    const task = await tasks.add("Read the RFC", "2026-12-06");
    const details = "  https://example.com/rfc\n- section 3 first\n";

    const updated = await tasks.setDetails(task.id, details);

    expect(updated.details).toBe(details);
    expect((await tasks.today("2026-12-06")).map((shown) => shown.details)).toEqual([details]);
  });

  it("starts a Task with no Details and lets them be cleared", async () => {
    const task = await tasks.add("Pay rent", "2026-12-07");
    expect(task.details).toBe("");

    await tasks.setDetails(task.id, "Landlord's account");
    await tasks.setDetails(task.id, "");

    expect((await tasks.today("2026-12-07"))[0].details).toBe("");
  });

  it("keeps Details through a rename and a delete followed by restore", async () => {
    const task = await tasks.add("Book flights", "2026-12-08");
    await tasks.setDetails(task.id, "Window seat");
    await tasks.rename(task.id, "Book flights to Lisbon");

    await tasks.restore(await tasks.delete(task.id));

    expect((await tasks.today("2026-12-08"))[0]).toMatchObject({
      title: "Book flights to Lisbon",
      details: "Window seat",
    });
  });

  it("refuses to set Details on a Task that does not exist", async () => {
    await expect(tasks.setDetails("no-such-task", "Notes")).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });
  it("saves a \"[ ] \" Checklist item as \"[] \" and keeps other lines as typed", async () => {
    const task = await tasks.add("Write the post", "2026-12-09");

    const updated = await tasks.setDetails(task.id, "[ ] Draft\n- [ ] not a Checklist item\n[x] Outline");

    expect(updated.details).toBe("[] Draft\n- [ ] not a Checklist item\n[x] Outline");
  });

  it("ticks and unticks a Checklist item, rewriting only that line", async () => {
    const task = await tasks.add("Write the post", "2026-12-10");
    await tasks.setDetails(task.id, "https://example.com\n[] Draft\n[] Edit");

    const ticked = await tasks.setChecklistItem(task.id, 2, true);
    expect(ticked.details).toBe("https://example.com\n[] Draft\n[x] Edit");

    await tasks.setChecklistItem(task.id, 2, false);
    expect((await tasks.today("2026-12-10"))[0].details).toBe(
      "https://example.com\n[] Draft\n[] Edit",
    );
  });

  it("refuses to tick a line that is not a Checklist item and leaves the Details alone", async () => {
    const task = await tasks.add("Write the post", "2026-12-11");
    await tasks.setDetails(task.id, "- outline\n[] Draft");

    await expect(tasks.setChecklistItem(task.id, 0, true)).rejects.toBeInstanceOf(
      tasks.NotAChecklistItemError,
    );
    await expect(tasks.setChecklistItem(task.id, 2, true)).rejects.toBeInstanceOf(
      tasks.NotAChecklistItemError,
    );

    expect((await tasks.today("2026-12-11"))[0].details).toBe("- outline\n[] Draft");
  });

  it("leaves the Task open when its only Checklist item is ticked", async () => {
    const task = await tasks.add("Write the post", "2026-12-12");
    await tasks.setDetails(task.id, "[] Draft");

    await tasks.setChecklistItem(task.id, 0, true);

    // The snapshot holds every stored field, including the day it was completed.
    expect((await tasks.delete(task.id)).completedDay).toBeNull();
  });

  it("refuses to tick a Checklist item of a Task that does not exist", async () => {
    await expect(tasks.setChecklistItem("no-such-task", 0, true)).rejects.toBeInstanceOf(
      tasks.TaskNotFoundError,
    );
  });
});
