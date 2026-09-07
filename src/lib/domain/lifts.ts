import type { LiftConfig, LiftId } from './types';

/** The empty barbell the log is written against. */
const BAR = 20;

/**
 * Shared defaults. Everything a lift does not override comes from here, so a
 * config below reads as "how this lift differs from the house style".
 */
const BASE = {
	increment: 2.5,
	roundTo: 2.5,
	barWeight: BAR,
	topSetReps: 5,
	maxTopSetReps: 5,
	deloadFactor: 0.9,
	topSetRest: '3-4 min',
	backoffRest: '2-3 min',
	warmupRest: '30-60 sec'
} as const;

/**
 * Upper-body press ramp. Three warm-up sets total (bar + two), with the last
 * landing 10-20 lb under the top set.
 */
const PRESS_WARMUP = { percents: [58, 82], reps: ['5', '2-3'] };
const PRESS_WARMUP_EXTENDED = { percents: [45, 65, 82], reps: ['5', '3', '2'] };

/**
 * Lower-body ramp. Four warm-up sets, because the gap between an empty bar and
 * a 150 lb+ top set is too wide to cover in two jumps.
 */
const LOWER_WARMUP = { percents: [45, 65, 80], reps: ['5', '3', '2'] };
const LOWER_WARMUP_EXTENDED = { percents: [35, 55, 70, 82], reps: ['5', '5', '3', '2'] };

export const BENCH: LiftConfig = {
	...BASE,
	id: 'bench',
	name: 'Bench Press',
	shortName: 'Bench',
	model: 'load',
	warmup: PRESS_WARMUP,
	warmupExtended: PRESS_WARMUP_EXTENDED,
	backoffs: [
		{ percent: 85, minReps: 6, maxReps: 8 },
		{ percent: 82.5, minReps: 6, maxReps: 8 },
		{ percent: 80, minReps: 6, maxReps: 8 }
	],
	finisher: { percent: 55, reps: 'max' },
	coachingNotes: [
		'One top set only. A second set at the same weight is a fatigued set in disguise, not extra strength work.',
		'Failing near the chest points at pecs; failing at lockout points at triceps — pick your accessory work accordingly.'
	]
};

export const OHP: LiftConfig = {
	...BASE,
	id: 'ohp',
	name: 'Overhead Press',
	shortName: 'OHP',
	model: 'load',
	warmup: PRESS_WARMUP,
	warmupExtended: PRESS_WARMUP_EXTENDED,
	backoffs: [
		{ percent: 85, minReps: 6, maxReps: 8 },
		{ percent: 82.5, minReps: 6, maxReps: 8 },
		{ percent: 80, minReps: 6, maxReps: 8 }
	],
	finisher: { percent: 55, reps: 'max' },
	coachingNotes: [
		'The smallest of the barbell lifts — if 2.5 lb per session starts outrunning you, move to 1.25 lb micro-plates or add weight every other clean session.',
		'The empty-bar set earns its place here: it warms the shoulder joint specifically before overhead loading.'
	]
};

export const SQUAT: LiftConfig = {
	...BASE,
	id: 'squat',
	name: 'Squat',
	shortName: 'Squat',
	model: 'load',
	warmup: LOWER_WARMUP,
	warmupExtended: LOWER_WARMUP_EXTENDED,
	backoffs: [{ percent: 85, minReps: 5, maxReps: 8 }],
	coachingNotes: [
		'Switched to one top set pre-emptively: squats carry more systemic fatigue than presses, so grinding a second top set costs more recovery than it did upstairs.',
		'A second back-off set is a reasonable upgrade later if you are recovering well — start with one.'
	]
};

export const DEADLIFT: LiftConfig = {
	...BASE,
	id: 'deadlift',
	name: 'Deadlift',
	shortName: 'Deadlift',
	model: 'load',
	warmup: LOWER_WARMUP,
	warmupExtended: LOWER_WARMUP_EXTENDED,
	// Deliberately the lighter end of the 80-85% band: deadlift has the worst
	// fatigue-to-benefit ratio per back-off set of any lift in the program.
	backoffs: [{ percent: 80, minReps: 5, maxReps: 8, optional: true }],
	coachingNotes: [
		'The back-off is marked optional on purpose — drop it on any session where you feel beaten up. It is the first thing to cut, before the top set.',
		'Kept at the 80% end rather than 85% because deadlift recovery cost per set is higher than squat or press.'
	]
};

export const ROW: LiftConfig = {
	...BASE,
	id: 'row',
	name: 'Barbell Row',
	shortName: 'Row',
	model: 'load',
	warmup: PRESS_WARMUP,
	warmupExtended: PRESS_WARMUP_EXTENDED,
	backoffs: [
		{ percent: 85, minReps: 6, maxReps: 8 },
		{ percent: 80, minReps: 6, maxReps: 8 }
	],
	finisher: { percent: 55, reps: 'max' },
	coachingNotes: [
		'The research thread never prescribed a row structure — this mirrors the press template with one fewer back-off set, since row was still progressing linearly.',
		'Row strength around 70%+ of your bench supports a stable pressing base, so keep it climbing alongside bench.'
	]
};

export const CURL: LiftConfig = {
	...BASE,
	id: 'curl',
	name: 'Barbell Curl',
	shortName: 'Curl',
	model: 'rep',
	// Biceps respond to moderate loads and clean reps, so reps climb 8 -> 12
	// before the weight moves at all.
	topSetReps: 8,
	maxTopSetReps: 12,
	warmup: { percents: [65], reps: ['5'] },
	warmupExtended: { percents: [50, 72], reps: ['5', '3'] },
	backoffs: [{ percent: 82.5, minReps: 8, maxReps: 10 }],
	accessory: {
		name: 'Dumbbell Curl',
		reps: '12-15, to failure',
		rest: '60-90 sec'
	},
	topSetRest: '2-3 min',
	backoffRest: '90 sec - 2 min',
	coachingNotes: [
		'Reps first, then weight. Grinding 3-5 reps on a curl taxes your elbows without much payoff — climb 8 to 12 clean reps, then add 2.5 lb and drop back to 8.',
		'Rest 60-90 seconds before the dumbbell finisher rather than dropping straight into it — the point is a clean set to failure, not extra fatigued reps.',
		'This lands at the end of an OHP/deadlift day, so your grip and biceps are already partly cooked. Let the weight reflect that.'
	]
};

/** Every lift the calculator knows about, in workout order. */
export const LIFTS: readonly LiftConfig[] = [BENCH, OHP, SQUAT, DEADLIFT, ROW, CURL];

const LIFT_BY_ID = new Map<LiftId, LiftConfig>(LIFTS.map((lift) => [lift.id, lift]));

export function getLift(id: LiftId): LiftConfig {
	const lift = LIFT_BY_ID.get(id);
	if (!lift) throw new Error(`Unknown lift: ${id}`);
	return lift;
}

export function isLiftId(value: string): value is LiftId {
	return LIFT_BY_ID.has(value as LiftId);
}
