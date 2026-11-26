# nexo

A calm, local-first personal workspace for a single user, where an assistant helps turn the day's inputs into a plan.

## Language

**Task**:
A single thing the user intends to do, which is either open or done.
_Avoid_: Todo, to-do, item, action item

**Details**:
Free text written under a Task's title that adds context to that Task, such as a link.
_Avoid_: Notes, description, body

**Checklist item**:
A checkable line within a Task's Details; ticking it never completes the Task, and completing the Task leaves it untouched.
_Avoid_: Subtask, step

**Planned day**:
The calendar day a Task is meant to be worked on.
_Avoid_: Due date, deadline, scheduled date

**Carried-over Task**:
An open Task whose Planned day is before today, shown on Today until it is done or deleted.
_Avoid_: Overdue, rolled-over, late task

**Previous**:
The view of done Tasks from earlier days, each kept for a limited time before it is permanently deleted.
_Avoid_: History, archive, completed list

**Today**:
The signed-in home view: the user's day, showing the Tasks they mean to work on today.
_Avoid_: Home, dashboard, landing page
