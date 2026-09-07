import { formatNumber, roundToIncrement } from './rounding';
import type { LiftConfig, LiftInput, TopSetOutcome, TopSetPrescription } from './types';

/**
 * Classify last session's top set from the reps you logged.
 *
 * Hitting the target is a clean session unless you flagged it as a grind;
 * coming up short is a miss. For the rep-model lifts the "target" is the bottom
 * rung of the ladder, since the rung you were actually chasing is whatever you
 * managed last time.
 */
export function deriveOutcome(input: LiftInput, lift: LiftConfig): TopSetOutcome {
	if (input.lastTopSetReps < lift.topSetReps) return 'miss';
	return input.grindy ? 'grind' : 'clean';
}

/**
 * Decide the next top set from the last one.
 *
 * The rule set, straight from the plan:
 *  - clean top set  -> add the load increment (or a rep, on rep-model lifts)
 *  - hit but grindy -> hold the same weight one more session
 *  - missed         -> hold; a *second* consecutive miss cuts 10% and rebuilds
 */
export function nextTopSet(input: LiftInput, lift: LiftConfig): TopSetPrescription {
	const outcome = deriveOutcome(input, lift);
	const prescription =
		lift.model === 'rep'
			? nextRepModelTopSet(input, lift, outcome)
			: nextLoadModelTopSet(input, lift, outcome);

	return {
		...prescription,
		outcome,
		weightDelta: round(prescription.weight - input.lastTopSetWeight)
	};
}

type PartialPrescription = Omit<TopSetPrescription, 'weightDelta' | 'outcome'>;

function nextLoadModelTopSet(
	input: LiftInput,
	lift: LiftConfig,
	outcome: TopSetOutcome
): PartialPrescription {
	const { lastTopSetWeight, previousSessionMissed } = input;
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
			rationale: `Two misses in a row. Drop ${deloadPercent(lift)}% and rebuild from a weight you can own.`
		};
	}

	return {
		weight: lastTopSetWeight,
		targetReps,
		action: 'hold',
		rationale: `${input.lastTopSetReps} of ${targetReps} reps last session. Repeat the same weight — no added load until the top set is clean. Miss it again and the next session deloads.`
	};
}

function nextRepModelTopSet(
	input: LiftInput,
	lift: LiftConfig,
	outcome: TopSetOutcome
): PartialPrescription {
	const { lastTopSetWeight, previousSessionMissed } = input;
	const lastReps = clampReps(input.lastTopSetReps, lift);

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
			rationale: `Two sessions short of ${lift.topSetReps} reps. Cut ${deloadPercent(lift)}% and restart the rep ladder.`
		};
	}

	return {
		weight: lastTopSetWeight,
		targetReps: Math.max(lastReps, outcome === 'miss' ? lift.topSetReps : lastReps),
		action: 'hold',
		rationale:
			outcome === 'grind'
				? `Repeat ${lastReps} reps at this weight until they are clean — the rep ladder only moves on clean sets.`
				: `Short of the ${lift.topSetReps}-rep floor. Hold here until you own it, then start climbing the ladder.`
	};
}

/** Cut the top set by the lift's deload factor, rounded to a loadable weight. */
export function deloadWeight(weight: number, lift: LiftConfig): number {
	const dropped = roundToIncrement(weight * lift.deloadFactor, lift.roundTo);
	// Guarantee the deload actually moves, even at very light loads.
	const capped = Math.min(dropped, round(weight - lift.increment));
	return Math.max(capped, lift.barWeight);
}

function deloadPercent(lift: LiftConfig): number {
	return Math.round((1 - lift.deloadFactor) * 100);
}

function clampReps(reps: number, lift: LiftConfig): number {
	if (!Number.isFinite(reps)) return lift.topSetReps;
	return Math.min(Math.max(Math.round(reps), 1), lift.maxTopSetReps);
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
