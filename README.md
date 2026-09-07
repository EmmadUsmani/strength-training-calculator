# Top Set

A static strength-training calculator for a one-top-set, back-off-volume program.

Give it the top set and back-offs you did last session, and it prescribes the
whole next session: warm-up ramp, one top set, back-offs, and the optional
finisher. It also projects that forward over the coming sessions — with weeks
and dates — and documents the rules it is following.

Your inputs are saved in `localStorage` so you do not retype them each session,
but that is purely a typing convenience: the snapshot only ever refills the form
fields. There is no rolling log of past workouts and nothing is inferred from a
previous visit — every prescription is computed from the form as it stands, so
a restored session and a hand-typed one produce identical results.

The methodology comes from a research thread about breaking an upper-body
plateau on a Greyskull-style linear progression; `/methodology` in the app is the
full write-up.

## Running it

```sh
pnpm install
pnpm dev        # dev server
pnpm test       # vitest
pnpm check      # svelte-check
pnpm build      # static site into ./build
pnpm preview    # serve ./build
```

Every route is prerendered (`export const prerender = true` in
`src/routes/+layout.ts`) and the adapter is `@sveltejs/adapter-static` in strict
mode, so the build output is plain HTML/CSS/JS with no server and no data
dependencies. `trailingSlash: 'always'` makes it emit `progression/index.html`
rather than `progression.html`, so any static host serves it without rewrite
rules.

## Deployment

`.github/workflows/deploy.yml` type-checks, tests and builds on every push to
`main`, then publishes `build/` to GitHub Pages. Project pages are served from
`/<repo>`, so the workflow builds with `BASE_PATH=/${repo}`; local builds stay at
the root.

## Layout

```
src/lib/domain/       Pure calculation. No Svelte, no DOM, no I/O.
  types.ts              Shared types.
  lifts.ts              Per-lift configuration (the whole program, as data).
  rounding.ts           Weight rounding and formatting.
  progression.ts        Clean/grind/miss -> next top set.
  warmup.ts             The warm-up ramp.
  backoff.ts            Back-off blocks: when to hold, when to reset.
  schedule.ts           Frequency -> calendar weeks and dates.
  plan.ts               Assembles a full session.
  projection.ts         Runs the rules forward over N sessions.
  testing.ts            Input builder shared by the tests.
src/lib/content/      The methodology text, as data.
src/lib/state/        The rune state class, put on the tree by the root layout.
src/lib/components/   Presentation. `ui/` holds the generic pieces.
src/routes/           /, /progression, /methodology.
```

Tests live next to what they cover: `*.test.ts` for the domain modules,
`*.svelte.test.ts` for components.

## Program summary

| | Top set | Back-offs | Finisher |
| --- | --- | --- | --- |
| Bench, OHP | 1 × 5 | 3 at 80-85% × 6-8 | optional drop set at ~55% |
| Barbell row | 1 × 5 | 2 at 80-85% × 6-8 | optional drop set at ~55% |
| Squat | 1 × 5 | 1 at 85% × 5-8 | — |
| Deadlift | 1 × 5 | 1 at 80% × 5-8 (optional) | — |
| Barbell curl | 1 × 8-12 | 1 at 82.5% × 8-10 | dumbbell curl to failure |

Progression is gated on rep quality: a clean top set adds 2.5 lb, a grindy or
missed one repeats, and two consecutive misses cut 10%. The barbell curl instead
climbs 8 → 12 reps before the weight moves.

Back-off weights are held in *blocks* rather than tracking the top set session
to session. A block resets when either trigger fires — the top set has climbed
7.5 lb past the weight the block was set from, or the block has run for three
weeks' worth of sessions at your training frequency — and a deload resets it
too. Inside a block the reps climb toward the top of the range instead. The
automatic decision can be overridden per session with Hold or Reset now.
