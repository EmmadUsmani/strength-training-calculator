import { formatNumber, formatWeight, percentOf, roundToIncrement } from './rounding';
import type {
	BackoffDecision,
	BackoffInput,
	BackoffMode,
	LiftConfig,
	PrescribedSet,
	TopSetPrescription
} from './types';

/**
 * Hard ceiling on back-off load. Rounding to 2.5 lb moves a light lift by
 * nearly three percentage points, which can push a nominal 85% set above the
 * band and turn a volume set back into a near-maximal one — the exact problem
 * this program exists to fix. Rounding down is always the safe direction here.
 */
const BACKOFF_MAX_PERCENT = 85;

/** Same idea for the burnout set, which is meant to sit at 50-60%. */
const FINISHER_MAX_PERCENT = 60;

/**
 * How far the top set must climb past the block's anchor before the back-offs
 * are recalculated.
 *
 * The research gives a 5-10 lb window and expects it to land at 4-6 sessions in
 * practice. At the 5 lb end a perfectly clean run resets every other session,
 * which is far too often, so this takes the middle of the window: 7.5 lb is
 * three clean sessions, or the 4-6 the research predicts once the usual misses
 * and repeats are in the mix.
 */
export const RECALC_MOVEMENT_LB = 7.5;

/**
 * Time-based fallback, in weeks, for when progress is slower than 2.5 lb per
 * session. Converted to a session count using your training frequency.
 */
export const RECALC_WEEKS = 3;

/** The session count at which the time-based fallback fires. */
export function recalcSessionLimit(sessionsPerWeek: number): number {
	if (!Number.isFinite(sessionsPerWeek) || sessionsPerWeek <= 0) return 6;
	return Math.max(2, Math.round(RECALC_WEEKS * sessionsPerWeek));
}

/**
 * The top set weight a given back-off weight implies.
 *
 * Back-offs are set as a percentage of the top set, so running that backwards
 * recovers the top set the block was anchored to — which is what the movement
 * trigger measures against.
 *
 * Derived back-offs are rounded *down* to stay inside the 80-85% band, so one
 * back-off weight is consistent with a small range of top sets. Half an
 * increment is added back to land in the middle of that range; without it the
 * anchor reads systematically light and the trigger fires a session early.
 */
export function impliedAnchor(backoffWeight: number, lift: LiftConfig): number {
	const primary = lift.backoffs[0].percent;
	// Snapped to a loadable weight, since a top set could only ever have been
	// one — and it keeps the number readable where the UI shows it.
	return roundToIncrement(((backoffWeight + lift.roundTo / 2) * 100) / primary, lift.roundTo);
}

/**
 * Decide whether this session holds the current back-off block or resets it.
 *
 * Automatic triggers, whichever comes first:
 *  - the top set has climbed `RECALC_MOVEMENT_LB` past the block's anchor
 *  - the block has run for `RECALC_WEEKS` worth of sessions
 *  - the top set deloaded, in which case the block resets with it
 */
export function decideBackoff(
	topSet: TopSetPrescription,
	lift: LiftConfig,
	backoff: BackoffInput | null,
	options: { mode: BackoffMode; sessionsPerWeek: number }
): BackoffDecision {
	const sessionLimit = recalcSessionLimit(options.sessionsPerWeek);

	if (!backoff) {
		return {
			recalculate: true,
			mode: options.mode,
			trigger: 'no-history',
			reason:
				'No back-off block recorded, so these are calculated fresh from today’s top set. Log the weight you use and the calculator will hold it for you next time.',
			anchor: null,
			movement: null,
			sessionLimit,
			sessionsUsed: 0
		};
	}

	const anchor = impliedAnchor(backoff.weight, lift);
	const movement = round2(topSet.weight - anchor);
	const sessionsUsed = Math.max(0, Math.round(backoff.sessionsUsed));
	const base = { mode: options.mode, anchor, movement, sessionLimit, sessionsUsed };

	if (options.mode === 'hold') {
		return {
			...base,
			recalculate: false,
			trigger: 'manual',
			reason: `Holding the block by hand at ${formatWeight(backoff.weight)}.`
		};
	}

	if (options.mode === 'recalculate') {
		return {
			...base,
			recalculate: true,
			trigger: 'manual',
			reason: `Resetting the block by hand off today’s ${formatWeight(topSet.weight)} top set.`
		};
	}

	if (topSet.action === 'deload') {
		return {
			...base,
			recalculate: true,
			trigger: 'deload',
			reason:
				'The top set deloaded, so the back-off block resets with it rather than sitting on top of a lighter top set.'
		};
	}

	if (movement >= RECALC_MOVEMENT_LB) {
		return {
			...base,
			recalculate: true,
			trigger: 'movement',
			reason: `The top set is up ${formatNumber(movement)} lb on the ${formatWeight(anchor)} these back-offs were set from, so the block resets off today’s top set.`
		};
	}

	if (sessionsUsed >= sessionLimit) {
		return {
			...base,
			recalculate: true,
			trigger: 'sessions',
			reason: `${sessionsUsed} sessions on this back-off weight reaches the ${RECALC_WEEKS}-week fallback at ${formatNumber(options.sessionsPerWeek)}×/week, so the block resets even though the top set has only moved ${formatNumber(movement)} lb.`
		};
	}

	const sessionsLeft = sessionLimit - sessionsUsed;
	// Reported in whole increments: a fractional remainder is not actionable when
	// the bar only moves 2.5 lb at a time.
	const lbLeft = round2(
		Math.ceil((RECALC_MOVEMENT_LB - movement) / lift.increment) * lift.increment
	);
	return {
		...base,
		recalculate: false,
		trigger: null,
		reason: `Holding the block. It resets once the top set is up another ${formatNumber(lbLeft)} lb, or after ${sessionsLeft} more session${sessionsLeft === 1 ? '' : 's'} at this weight.`
	};
}

/**
 * Build the back-off sets: 80-85% of the anchoring top set, which is where the
 * volume that actually raises your ceiling gets accumulated.
 *
 * A held block keeps the weight you logged and climbs reps toward the top of
 * the range instead; a recalculated block resets to the bottom of the range at
 * a weight derived from today's top set.
 */
export function buildBackoffs(
	topSetWeight: number,
	lift: LiftConfig,
	decision: BackoffDecision,
	backoff: BackoffInput | null
): PrescribedSet[] {
	const held = !decision.recalculate && backoff !== null;
	const primaryPercent = lift.backoffs[0].percent;

	return lift.backoffs.map((spec, index) => {
		const weight = held
			? // Keep the logged weight for the heaviest set and step the rest down
				// by the same ratios the spec uses, so the shape of the block survives.
				capWeight(
					roundToIncrement((backoff.weight * spec.percent) / primaryPercent, lift.roundTo),
					topSetWeight,
					lift,
					BACKOFF_MAX_PERCENT
				)
			: derivedWeight(topSetWeight, spec.percent, lift, BACKOFF_MAX_PERCENT);

		const reps = held ? nextBackoffReps(backoff.reps, spec) : spec.minReps;

		return {
			kind: 'backoff' as const,
			label: lift.backoffs.length === 1 ? 'Back-off' : `Back-off ${index + 1}`,
			weight,
			reps: held ? String(reps) : `${spec.minReps}-${spec.maxReps}`,
			percentOfTop: percentOf(weight, topSetWeight),
			rest: lift.backoffRest,
			optional: spec.optional
		};
	});
}

/**
 * Within a block the reps climb before the weight does: hit the range cleanly
 * and chase one more rep next session, up to the top of the range.
 */
export function nextBackoffReps(
	lastReps: number,
	spec: { minReps: number; maxReps: number }
): number {
	if (!Number.isFinite(lastReps)) return spec.minReps;
	const next = Math.round(lastReps) + 1;
	return Math.min(Math.max(next, spec.minReps), spec.maxReps);
}

/**
 * The optional burnout set. Below roughly 60% of the top set there is little
 * mechanical tension left, so this is explicitly "extra credit" — the first
 * thing to cut when recovery is poor.
 */
export function buildFinisher(topSetWeight: number, lift: LiftConfig): PrescribedSet[] {
	if (!lift.finisher) return [];
	const weight = derivedWeight(topSetWeight, lift.finisher.percent, lift, FINISHER_MAX_PERCENT);
	return [
		{
			kind: 'finisher',
			label: 'Drop set',
			weight,
			reps: lift.finisher.reps,
			percentOfTop: percentOf(weight, topSetWeight),
			rest: '—',
			optional: true
		}
	];
}

/** The accessory movement closing out the session, if the lift has one. */
export function buildAccessory(lift: LiftConfig): PrescribedSet[] {
	if (!lift.accessory) return [];
	return [
		{
			kind: 'finisher',
			label: 'Finisher',
			weight: null,
			reps: lift.accessory.reps,
			percentOfTop: null,
			rest: lift.accessory.rest,
			exercise: lift.accessory.name,
			optional: false
		}
	];
}

/**
 * A percentage of the top set, rounded to a loadable weight, kept strictly
 * below the top set and never above `maxPercent` of it.
 */
function derivedWeight(
	topSetWeight: number,
	percent: number,
	lift: LiftConfig,
	maxPercent: number
): number {
	const raw = roundToIncrement((topSetWeight * percent) / 100, lift.roundTo);
	return capWeight(raw, topSetWeight, lift, maxPercent);
}

function capWeight(
	weight: number,
	topSetWeight: number,
	lift: LiftConfig,
	maxPercent: number
): number {
	const ceiling = Math.min((topSetWeight * maxPercent) / 100, topSetWeight - lift.roundTo);

	let capped = weight;
	while (capped > ceiling && capped - lift.roundTo >= lift.barWeight) {
		capped = roundToIncrement(capped - lift.roundTo, lift.roundTo);
	}

	return Math.max(Math.min(capped, ceiling), lift.barWeight);
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
