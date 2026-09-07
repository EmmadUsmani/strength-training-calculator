import { buildAccessory, buildBackoffs, buildFinisher, decideBackoff } from './backoff';
import { nextTopSet } from './progression';
import { formatNumber, formatWeight } from './rounding';
import { buildWarmup, needsExtendedWarmup } from './warmup';
import type {
	BackoffDecision,
	BackoffMode,
	LiftConfig,
	LiftInput,
	PrescribedSet,
	TopSetPrescription,
	WorkoutPlan
} from './types';

export interface PlanOptions {
	/** Force the longer warm-up ramp, e.g. after time away from the gym. */
	forceExtendedWarmup?: boolean;
	/** Override the automatic hold-or-recalculate decision for the back-offs. */
	backoffMode?: BackoffMode;
}

/**
 * Turn "here is what I did last time" into a full prescribed session:
 * warm-up ramp, one top set, back-offs and an optional finisher.
 */
export function buildWorkoutPlan(
	input: LiftInput,
	lift: LiftConfig,
	options: PlanOptions = {}
): WorkoutPlan {
	const topSet = nextTopSet(input, lift);
	const backoff = decideBackoff(topSet, lift, input.backoff, {
		mode: options.backoffMode ?? 'auto',
		sessionsPerWeek: input.sessionsPerWeek
	});

	const extended =
		options.forceExtendedWarmup ||
		needsExtendedWarmup(topSet.weightDelta, topSet.action === 'deload');

	const topSetSet: PrescribedSet = {
		kind: 'top',
		label: 'Top set',
		weight: topSet.weight,
		reps: String(topSet.targetReps),
		percentOfTop: 100,
		rest: lift.backoffRest
	};

	const sets: PrescribedSet[] = [
		...buildWarmup(topSet.weight, lift, { extended }),
		topSetSet,
		...buildBackoffs(topSet.weight, lift, backoff, input.backoff),
		...buildFinisher(topSet.weight, lift),
		...buildAccessory(lift)
	];

	return { lift, input, topSet, backoff, sets, notes: buildNotes(topSet, backoff, lift, extended) };
}

function buildNotes(
	topSet: TopSetPrescription,
	backoff: BackoffDecision,
	lift: LiftConfig,
	extended: boolean
): string[] {
	const notes: string[] = [];

	if (topSet.action === 'advance-load') {
		notes.push(
			`Hit ${topSet.targetReps} clean reps at ${formatWeight(topSet.weight)} and you add another ${formatNumber(lift.increment)} lb next session.`
		);
	}
	if (topSet.action === 'advance-reps') {
		notes.push(
			`Once you hit ${lift.maxTopSetReps} clean reps here, add ${formatNumber(lift.increment)} lb and restart the ladder at ${lift.topSetReps}.`
		);
	}
	if (topSet.action === 'hold') {
		notes.push('Miss the top set again next session and the weight drops 10% to rebuild.');
	}
	if (topSet.action === 'deload') {
		notes.push(
			'Treat the rebuild as a fresh run: clean reps only, and the weight will climb back faster than it fell.'
		);
	}

	notes.push(backoff.reason);

	if (backoff.recalculate && backoff.trigger !== 'no-history') {
		notes.push(
			`This is session 1 of the new back-off block — log it as such next time so the ${backoff.sessionLimit}-session fallback counts from here.`
		);
	}

	if (extended) {
		notes.push(
			'Using the longer warm-up ramp because the top set moved significantly — go back to the short ramp on normal 2.5 lb sessions.'
		);
	}
	if (lift.finisher) {
		notes.push(
			'The drop set is optional extra credit. Cut it first if you are run down — before touching the top set or back-offs.'
		);
	}

	return notes;
}
