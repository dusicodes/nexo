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
