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
A checkable line within a Task's Details; ticking it never completes the Task. While the Task is done, its Checklist items show ticked and struck through with the rest of it, but their own ticks are kept, so reopening the Task shows them as they were.
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
The user's day, showing the Tasks they mean to work on today.
_Avoid_: Home, dashboard, landing page

**Focus**:
The one feature filling the middle of nexo; any feature can be the Focus, and focusing another one turns the current Focus into a Panel.
_Avoid_: Main screen, main view, zoomed view

**Panel**:
A borderless, floating view of a feature that is not the Focus, which the user can drag anywhere and give a colour, showing a glanceable summary plus at most a quick action or two (ticking a Task, messaging the Assistant); clicking it makes that feature the Focus.
_Avoid_: Widget, card, tile, window

**Tucked Panel**:
A Panel the user has pushed off the edge of the window, leaving only a slip at that edge that peeks out on hover; clicking it makes that feature the Focus, and dragging it back in makes it a Panel again.
_Avoid_: Hidden, minimised, collapsed, docked

**Assistant**:
The AI the user chats with, in its Panel or as the Focus; the default Focus whenever nexo is opened.
_Avoid_: Chatbot, bot, AI

**Email account**:
One of the user's own mailboxes that nexo reads, such as a personal account and a work & school account, each named by the user. All Email accounts share one Email Panel until the user drags one out into a Panel of its own.
_Avoid_: Inbox, mailbox, address
