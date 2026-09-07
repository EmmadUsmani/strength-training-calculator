import { buildBackoffs, decideBackoff } from './backoff';
import { nextTopSet } from './progression';
import { dateOfSession, weekOf } from './schedule';
import type {
	BackoffDecision,
	BackoffInput,
	LiftConfig,
	LiftInput,
	TopSetOutcome,
	TopSetPrescription
} from './types';

/** How the projection assumes future sessions will go. */
export type ProjectionScenario =
	/** Every top set clean — the fastest path the rules allow. */
	| 'clean'
	/** Clean, then a grind, alternating: what progress looks like when it gets heavy. */
	| 'alternating'
	/** Every top set missed: demonstrates the hold-then-deload cycle. */
	| 'stall';

export interface ProjectedSession {
	/** 1-based, where 1 is the session the calculator is prescribing now. */
	session: number;
	/** Calendar week, counting the first seven days after your last session as week 1. */
	week: number;
	/** Calendar date, when a last-session date was supplied. */
	date: Date | null;
	/** The outcome this row assumes for its *own* top set. */
	assumedOutcome: TopSetOutcome;
	topSet: TopSetPrescription;
	backoff: BackoffDecision;
	backoffWeights: number[];
	/** Sessions this back-off block will have run once this one is done. */
	backoffSession: number;
}

export interface ProjectionOptions {
	scenario?: ProjectionScenario;
	/** When the last session happened; omit to leave dates off the projection. */
	lastSessionDate?: Date | null;
}

export const SCENARIO_LABELS: Record<ProjectionScenario, string> = {
	clean: 'Every session clean',
	alternating: 'Clean, then a grind',
	stall: 'Stalled out'
};

export const SCENARIO_DESCRIPTIONS: Record<ProjectionScenario, string> = {
	clean: 'The best case the rules allow: the top set moves every session.',
	alternating:
		'A clean session followed by a grindy one, which is what progress usually looks like once the weight gets real.',
	stall: 'Every top set missed, so you can see exactly when the 10% deload fires.'
};

/**
 * Project forward from the current input by feeding each session's prescription
 * back in as the next session's history — including the back-off block, so the
 * table shows exactly which sessions reset it.
 */
export function projectSessions(
	input: LiftInput,
	lift: LiftConfig,
	sessionCount: number,
	options: ProjectionOptions = {}
): ProjectedSession[] {
	const scenario = options.scenario ?? 'clean';
	const lastSessionDate = options.lastSessionDate ?? null;
	const sessions: ProjectedSession[] = [];

	let current = input;

	for (let index = 0; index < sessionCount; index++) {
		const topSet = nextTopSet(current, lift);
		const decision = decideBackoff(topSet, lift, current.backoff, {
			mode: 'auto',
			sessionsPerWeek: current.sessionsPerWeek
		});
		const sets = buildBackoffs(topSet.weight, lift, decision, current.backoff);
		const weights = sets.map((set) => set.weight ?? 0);
		const assumedOutcome = outcomeFor(scenario, index);
		const backoffSession = decision.recalculate ? 1 : decision.sessionsUsed + 1;

		sessions.push({
			session: index + 1,
			week: weekOf(index + 1, input.sessionsPerWeek),
			date: lastSessionDate
				? dateOfSession(index + 1, input.sessionsPerWeek, lastSessionDate)
				: null,
			assumedOutcome,
			topSet,
			backoff: decision,
			backoffWeights: weights,
			backoffSession
		});

		current = {
			...current,
			lastTopSetWeight: topSet.weight,
			lastTopSetReps: repsFor(assumedOutcome, topSet, lift),
			grindy: assumedOutcome === 'grind',
			// Two sessions back, except that a deload clears the miss streak — so a
			// stalled lift cycles hold -> deload -> hold rather than deloading every
			// single session.
			previousSessionMissed:
				topSet.action === 'deload' ? false : current.lastTopSetReps < lift.topSetReps,
			backoff: nextBackoffState(lift, weights[0], sets[0]?.reps, backoffSession)
		};
	}

	return sessions;
}

function nextBackoffState(
	lift: LiftConfig,
	weight: number,
	prescribedReps: string | undefined,
	sessionsUsed: number
): BackoffInput {
	const spec = lift.backoffs[0];
	// Assume you hit what was prescribed. A freshly reset block prescribes a
	// range ("6-8"), so assume the bottom of it; a held block prescribes the
	// single rep count you are chasing.
	const prescribed = prescribedReps?.includes('-')
		? spec.minReps
		: Number(prescribedReps ?? spec.minReps);

	return {
		weight,
		reps: Math.min(Math.max(prescribed, spec.minReps), spec.maxReps),
		sessionsUsed
	};
}

function outcomeFor(scenario: ProjectionScenario, index: number): TopSetOutcome {
	switch (scenario) {
		case 'clean':
			return 'clean';
		case 'alternating':
			return index % 2 === 0 ? 'clean' : 'grind';
		case 'stall':
			return 'miss';
	}
}

/** The rep count a given assumed outcome implies for the prescribed top set. */
function repsFor(
	outcome: TopSetOutcome,
	topSet: TopSetPrescription,
	lift: LiftConfig
): number {
	if (outcome === 'miss') return Math.max(0, lift.topSetReps - 1);
	return topSet.targetReps;
}
