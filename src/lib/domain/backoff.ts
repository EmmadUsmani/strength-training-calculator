import { percentOf, roundToIncrement } from './rounding';
import type { LiftConfig, PrescribedSet } from './types';

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
 * Build the back-off sets: 80-85% of the day's top set for 6-8 reps, which is
 * where the volume that actually raises your ceiling gets accumulated.
 *
 * Back-offs are recalculated from the current top set every session, so they
 * track your strength automatically rather than being held at a fixed anchor.
 */
export function buildBackoffs(topSetWeight: number, lift: LiftConfig): PrescribedSet[] {
	return lift.backoffs.map((spec, index) => {
		const weight = derivedWeight(topSetWeight, spec.percent, lift, BACKOFF_MAX_PERCENT);
		return {
			kind: 'backoff' as const,
			label: lift.backoffs.length === 1 ? 'Back-off' : `Back-off ${index + 1}`,
			weight,
			reps: spec.reps,
			percentOfTop: percentOf(weight, topSetWeight),
			rest: lift.backoffRest,
			optional: spec.optional
		};
	});
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
	const ceiling = Math.min(
		(topSetWeight * maxPercent) / 100,
		topSetWeight - lift.roundTo
	);

	let weight = roundToIncrement((topSetWeight * percent) / 100, lift.roundTo);
	while (weight > ceiling && weight - lift.roundTo >= lift.barWeight) {
		weight = roundToIncrement(weight - lift.roundTo, lift.roundTo);
	}

	return Math.max(Math.min(weight, ceiling), lift.barWeight);
}
