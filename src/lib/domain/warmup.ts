import { percentOf, roundToIncrement } from './rounding';
import type { LiftConfig, PrescribedSet, WarmupSpec } from './types';

/** Top set weight has to jump at least this much to justify the longer ramp. */
export const BIG_JUMP_LB = 10;

export interface WarmupOptions {
	/** Use the longer ramp (after a deload, a layoff, or a 10 lb+ jump). */
	extended?: boolean;
}

/**
 * Build the warm-up ramp: an empty-bar set, then ascending singles/triples up
 * to roughly 80% of the top set.
 *
 * Three sets is the default for presses; lower body gets four because the gap
 * between an empty bar and the top set is much wider. Weights that would land
 * at or above the top set, at or below the bar, or on a duplicate of an earlier
 * step are dropped rather than prescribed.
 */
export function buildWarmup(
	topSetWeight: number,
	lift: LiftConfig,
	options: WarmupOptions = {}
): PrescribedSet[] {
	const spec: WarmupSpec = options.extended ? lift.warmupExtended : lift.warmup;
	const weights: { weight: number; reps: string }[] = [
		{ weight: lift.barWeight, reps: '8-10' }
	];

	for (const [index, percent] of spec.percents.entries()) {
		const weight = roundToIncrement((topSetWeight * percent) / 100, lift.roundTo);
		const isUseful =
			weight > lift.barWeight &&
			weight < topSetWeight &&
			!weights.some((existing) => existing.weight === weight);
		if (isUseful) weights.push({ weight, reps: spec.reps[index] ?? '3' });
	}

	return weights.map(({ weight, reps }, index) => ({
		kind: 'warmup' as const,
		label: `Warm-up ${index + 1}`,
		weight,
		reps,
		percentOfTop: percentOf(weight, topSetWeight),
		// The last warm-up runs into the top set, which gets the long rest.
		rest: index === weights.length - 1 ? lift.topSetRest : lift.warmupRest
	}));
}

/** Whether this session warrants the longer ramp. */
export function needsExtendedWarmup(weightDelta: number, isDeload: boolean): boolean {
	return isDeload || weightDelta >= BIG_JUMP_LB;
}
