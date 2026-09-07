import { formatNumber, roundToIncrement } from './rounding';
import type { LiftConfig, LiftInput, TopSetPrescription } from './types';

/**
 * Decide the next top set from the last one.
 *
 * The rule set, straight from the plan:
 *  - clean top set  -> add the load increment (or a rep, on rep-model lifts)
 *  - hit but grindy -> hold the same weight one more session
 *  - missed         -> hold; a *second* consecutive miss cuts 10% and rebuilds
 */
export function nextTopSet(input: LiftInput, lift: LiftConfig): TopSetPrescription {
	const prescription =
		lift.model === 'rep' ? nextRepModelTopSet(input, lift) : nextLoadModelTopSet(input, lift);

	return { ...prescription, weightDelta: round(prescription.weight - input.lastTopSetWeight) };
}

function nextLoadModelTopSet(
	input: LiftInput,
	lift: LiftConfig
): Omit<TopSetPrescription, 'weightDelta'> {
	const { lastTopSetWeight, outcome, previousSessionMissed } = input;
	const targetReps = lift.topSetReps;

	if (outcome === 'clean') {
		return {
			weight: round(lastTopSetWeight + lift.increment),
			targetReps,
			action: 'advance-load',
			rationale: `Clean ${targetReps} reps last session, so the top set earns its ${formatNumber(lift.increment)} lb.`
		};
	}

	if (outcome === 'grind') {
		return {
			weight: lastTopSetWeight,
			targetReps,
			action: 'hold',
			rationale:
				'You hit the reps but ground out the last one or two. Repeat this weight until it moves cleanly — adding load onto a grind is how stalls start.'
		};
	}

	if (previousSessionMissed) {
		return {
			weight: deloadWeight(lastTopSetWeight, lift),
			targetReps,
			action: 'deload',
			rationale: `Two misses in a row. Drop ${Math.round((1 - lift.deloadFactor) * 100)}% and rebuild from a weight you can own.`
		};
	}

	return {
		weight: lastTopSetWeight,
		targetReps,
		action: 'hold',
		rationale:
			'Missed the rep target. Repeat the same weight — no added load until the top set is clean. Miss it again and the next session deloads.'
	};
}

function nextRepModelTopSet(
	input: LiftInput,
	lift: LiftConfig
): Omit<TopSetPrescription, 'weightDelta'> {
	const { lastTopSetWeight, outcome, previousSessionMissed } = input;
	const lastReps = clampReps(input.lastTopSetReps ?? lift.topSetReps, lift);

	if (outcome === 'clean') {
		if (lastReps >= lift.maxTopSetReps) {
			return {
				weight: round(lastTopSetWeight + lift.increment),
				targetReps: lift.topSetReps,
				action: 'advance-load',
				rationale: `${lastReps} clean reps tops out the ladder, so add ${formatNumber(lift.increment)} lb and drop back to ${lift.topSetReps} reps.`
			};
		}
		return {
			weight: lastTopSetWeight,
			targetReps: lastReps + 1,
			action: 'advance-reps',
			rationale: `Reps before weight: ${lastReps} clean reps last session, so chase ${lastReps + 1} at the same load. Weight moves once you reach ${lift.maxTopSetReps}.`
		};
	}

	if (outcome === 'miss' && previousSessionMissed) {
		return {
			weight: deloadWeight(lastTopSetWeight, lift),
			targetReps: lift.topSetReps,
			action: 'deload',
			rationale: `Two misses in a row. Cut ${Math.round((1 - lift.deloadFactor) * 100)}% and restart the rep ladder at ${lift.topSetReps}.`
		};
	}

	return {
		weight: lastTopSetWeight,
		targetReps: lastReps,
		action: 'hold',
		rationale:
			outcome === 'grind'
				? `Repeat ${lastReps} reps at this weight until they are clean — the rep ladder only moves on clean sets.`
				: `Hold here and hit ${lastReps} clean reps before pushing the ladder further.`
	};
}

/** Cut the top set by the lift's deload factor, rounded to a loadable weight. */
export function deloadWeight(weight: number, lift: LiftConfig): number {
	const dropped = roundToIncrement(weight * lift.deloadFactor, lift.roundTo);
	// Guarantee the deload actually moves, even at very light loads.
	const capped = Math.min(dropped, round(weight - lift.increment));
	return Math.max(capped, lift.barWeight);
}

function clampReps(reps: number, lift: LiftConfig): number {
	if (!Number.isFinite(reps)) return lift.topSetReps;
	return Math.min(Math.max(Math.round(reps), 1), lift.maxTopSetReps);
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
