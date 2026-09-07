# Top Set

A static strength-training calculator for a one-top-set, back-off-volume program.

Give it the top set you did last session and how it went, and it prescribes the
whole next session: warm-up ramp, one top set, back-offs, and the optional
finisher. It also projects that forward over the coming sessions and documents
the rules it is following.

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
dependencies.

## Layout

```
src/lib/domain/       Pure calculation. No Svelte, no DOM, no I/O.
  types.ts              Shared types.
  lifts.ts              Per-lift configuration (the whole program, as data).
  rounding.ts           Weight rounding and formatting.
  progression.ts        Clean/grind/miss -> next top set.
  warmup.ts             The warm-up ramp.
  backoff.ts            Back-off, drop and accessory sets.
  plan.ts               Assembles a full session.
  projection.ts         Runs the rules forward over N sessions.
src/lib/content/      The methodology text, as data.
src/lib/state/        The one shared rune store the three pages read from.
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
