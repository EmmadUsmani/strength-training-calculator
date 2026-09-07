import { nextTopSet } from './progression';
import type { LiftConfig, LiftInput, TopSetOutcome, TopSetPrescription } from './types';
import { buildBackoffs } from './backoff';

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
	/** The outcome this row assumes for its *own* top set. */
	assumedOutcome: TopSetOutcome;
	topSet: TopSetPrescription;
	backoffWeights: number[];
}

export const SCENARIO_LABELS: Record<ProjectionScenario, string> = {
	clean: 'Every session clean',
	alternating: 'Clean, then a grind',
	stall: 'Stalled out'
};

export const SCENARIO_DESCRIPTIONS: Record<ProjectionScenario, string> = {
	clean: 'The best case the rules allow: the top set moves every session.',
	alternating: 'A clean session followed by a grindy one, which is what progress usually looks like once the weight gets real.',
	stall: 'Every top set missed, so you can see exactly when the 10% deload fires.'
};

/**
 * Project forward from the current input by feeding each session's prescription
 * back in as the next session's history.
 */
export function projectSessions(
	input: LiftInput,
	lift: LiftConfig,
	sessionCount: number,
	scenario: ProjectionScenario = 'clean'
): ProjectedSession[] {
	const sessions: ProjectedSession[] = [];
	let current = input;

	for (let index = 0; index < sessionCount; index++) {
		const topSet = nextTopSet(current, lift);
		const assumedOutcome = outcomeFor(scenario, index);

		sessions.push({
			session: index + 1,
			assumedOutcome,
			topSet,
			backoffWeights: buildBackoffs(topSet.weight, lift).map((set) => set.weight ?? 0)
		});

		current = {
			lastTopSetWeight: topSet.weight,
			outcome: assumedOutcome,
			// Two sessions back, except that a deload clears the miss streak — so
			// a stalled lift cycles hold -> deload -> hold rather than deloading
			// on every single session.
			previousSessionMissed: topSet.action === 'deload' ? false : current.outcome === 'miss',
			lastTopSetReps: topSet.targetReps
		};
	}

	return sessions;
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
