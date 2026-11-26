---
status: accepted
---

# Floating Panels around a Focus, with no nav bar, opening on the Assistant

nexo has no navigation bar. One feature at a time is the **Focus** in the middle of the window. Every other feature floats around it as a **Panel**: a borderless, slightly tilted glass sheet with a glanceable summary. The user can drag Panels anywhere, overlap them, colour them, tuck them off an edge, and click one to make it the Focus. When nexo opens, the Assistant is the Focus.

We chose this over a conventional top nav bar because nexo exists to show the whole day at once. Calendar, Email, GitHub, the reading list and Today stay in view as summaries around whatever the user is working on, instead of hiding behind tabs. The owner explored the layout in an interactive prototype on 2026-11-26 (https://claude.ai/artifact/LHs76Tw8xj2sP8DYof6qRw) and chose it there.

## Consequences

- **Panel interactions:** a Panel can take a quick action or two in place (ticking a Task, messaging the Assistant), but anything more means focusing it. Every feature therefore needs both a Focus view and a Panel summary.
- **Today is no longer the home page:** spec #29 makes Today the signed-in home page, and that stays true until the Panel layout is built. When it is, the Assistant becomes the starting Focus and Today becomes a Panel.
- **Small screens:** below tablet width there are no Panels. A plain nav bar takes their place, because nexo is a desktop-first app.
- **Panel layout is per device:** positions, tucked Panels and colours are remembered on each device rather than synced. Saving a named workspace layout is a possible later setting.
- **Email accounts:** all Email accounts share one Email Panel by default, and dragging an account out gives it its own Panel.
