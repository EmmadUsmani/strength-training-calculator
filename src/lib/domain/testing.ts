import { DEFAULT_SESSIONS_PER_WEEK } from './schedule';
import type { LiftInput } from './types';

/** A complete `LiftInput` with the fields a test does not care about filled in. */
export function makeInput(overrides: Partial<LiftInput> = {}): LiftInput {
	return {
		lastTopSetWeight: 100,
		lastTopSetReps: 5,
		grindy: false,
		previousSessionMissed: false,
		backoff: null,
		sessionsPerWeek: DEFAULT_SESSIONS_PER_WEEK,
		...overrides
	};
}
