# Coding standards

Read during review. These are judgement calls; anything mechanical belongs in
`npm run check` (typecheck, lint, tests), which CI and the pre-commit hook run.

## Docs match the code

When a change alters behaviour, configuration, or a route, every claim about it
in `README.md`, `.env.example`, and `architecture.md` is still true after the
change. Search those files for the names the diff touches (env vars, paths,
routes, function names) and treat a stale claim as a defect in this change.

## architecture.md markers

`architecture.md` section 2 is the contract: a change that implements a
`selected` item updates its marker in the same change, and `implemented`
claims only what the repository and its tests show. A claim the tests do not
cover says so.

## Done against an issue

A change that closes an issue meets each acceptance criterion in the code,
checked one by one. A criterion that needs a manual check (a real Google
sign-in, a browser) is named as unverified rather than closed.

## Design language

Every surface of nexo looks the same way, the way Today does (issue #36; mockups
"A · Ink" and "A · Ink, light theme" on the design canvas linked from that issue).
New UI follows these rules, and review treats a departure from them as a defect.

- **Warm paper, not UI grey. One layout, two palettes.** Dark is Ink (warm near-black
  ground, warm off-white text) and is the default on first open; light is Daybook paper
  (cream ground, near-black warm text, warm brown links). The theme toggle switches
  them and remembers the choice. Themes change colours only, never layout.
- **Colours are theme tokens.** Use the tokens in `src/app/globals.css`
  (`background`, `foreground`, `muted-foreground`, `faint`, `link`, `link-hover`,
  `mark`, `mark-faint`, `checklist`, plus the shadcn set), never a one-off colour. A
  new colour is a new token with a value in both `:root` and `.dark`. Text tokens
  stay at 4.5:1 or more on the background in both themes; add any new text token to
  `src/test/palette-contrast.test.ts`. `mark` and `mark-faint` are for ink marks, never
  text.
- **Lots of space, almost no chrome.** A single centred column about 640px wide with a
  generous top margin. No cards, borders or boxes around the user's things.
- **Two voices.** The user's own words (Task titles, Details, Checklist items) are set
  in the sans (`font-sans`, Inter Tight). Anything nexo itself says (the weekday line,
  the "from Tuesday" hint, placeholders, and later the assistant's words) is set in the
  italic serif (`font-serif italic`, Newsreader), so nexo's words are never mistaken for
  the user's. UI labels and keyboard hints stay small and quiet in the sans.
- **Ink marks instead of stock widgets.** A Task's checkbox is a round ring drawn with
  `mark`, filled when done; a done Task is struck through with the hand-drawn
  `.ink-strike` stroke, not `line-through`, and its text dims to `faint`. Smaller
  marks inside a Task, such as Checklist items, are small rounded squares, and a ticked
  one takes a quiet `line-through` in `mark`, so it never reads as the Task being done.
- **Keyboard hints.** A quiet footer names the keys for features that exist, and only
  those; a feature that adds a key adds its hint.
- **Works at phone width.** Check every surface at about 390px wide.
