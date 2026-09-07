import { LIFTS, getLift } from '$lib/domain/lifts';
import { buildWorkoutPlan } from '$lib/domain/plan';
import { projectSessions, type ProjectionScenario } from '$lib/domain/projection';
import { DEFAULT_SESSIONS_PER_WEEK, today } from '$lib/domain/schedule';
import type { BackoffMode, LiftId, LiftInput, WorkoutPlan } from '$lib/domain/types';

/**
 * What the user reported for one lift. `null` means "not filled in yet"; the
 * calculator produces nothing until the top set weight is present.
 */
export interface LiftEntry {
	lastTopSetWeight: number | null;
	lastTopSetReps: number | null;
	grindy: boolean;
	previousSessionMissed: boolean;
	backoffWeight: number | null;
	backoffReps: number | null;
	backoffSessions: number | null;
	backoffMode: BackoffMode;
}

function emptyEntry(liftId: LiftId): LiftEntry {
	const lift = getLift(liftId);
	return {
		lastTopSetWeight: null,
		lastTopSetReps: lift.topSetReps,
		grindy: false,
		previousSessionMissed: false,
		backoffWeight: null,
		backoffReps: lift.backoffs[0].minReps,
		backoffSessions: 1,
		backoffMode: 'auto'
	};
}

function emptyEntries(): Record<LiftId, LiftEntry> {
	return Object.fromEntries(LIFTS.map((lift) => [lift.id, emptyEntry(lift.id)])) as Record<
		LiftId,
		LiftEntry
	>;
}

function isPositive(value: number | null): value is number {
	return value !== null && Number.isFinite(value) && value > 0;
}

/**
 * Shared calculator state.
 *
 * The three pages are all views over the same handful of inputs, so the state
 * lives here rather than in any one route. Nothing is written to disk or to
 * browser storage and nothing is carried over between visits: the same inputs
 * always produce the same prescription.
 */
export class PlannerState {
	entries = $state<Record<LiftId, LiftEntry>>(emptyEntries());
	selectedLiftId = $state<LiftId>('bench');
	forceExtendedWarmup = $state(false);
	sessionsPerWeek = $state(DEFAULT_SESSIONS_PER_WEEK);
	lastSessionDate = $state<Date>(today());
	scenario = $state<ProjectionScenario>('clean');
	sessionCount = $state(8);

	/** The lift currently being planned. */
	get lift() {
		return getLift(this.selectedLiftId);
	}

	/** The entry for the selected lift. */
	get entry(): LiftEntry {
		return this.entries[this.selectedLiftId];
	}

	/** Whether the selected lift has enough input to compute a plan. */
	get hasInput(): boolean {
		return isPositive(this.entry.lastTopSetWeight);
	}

	/** Whether a back-off block has been logged for the selected lift. */
	get hasBackoffBlock(): boolean {
		return isPositive(this.entry.backoffWeight);
	}

	/** The normalised domain input, or null when the form is incomplete. */
	get input(): LiftInput | null {
		if (!this.hasInput) return null;
		const entry = this.entry;
		const reps = entry.lastTopSetReps ?? 0;
		const missed = reps < this.lift.topSetReps;

		return {
			lastTopSetWeight: entry.lastTopSetWeight as number,
			lastTopSetReps: reps,
			// A grind only means anything when the reps were actually hit.
			grindy: !missed && entry.grindy,
			previousSessionMissed: missed && entry.previousSessionMissed,
			backoff: isPositive(entry.backoffWeight)
				? {
						weight: entry.backoffWeight,
						reps: entry.backoffReps ?? this.lift.backoffs[0].minReps,
						sessionsUsed: Math.max(1, entry.backoffSessions ?? 1)
					}
				: null,
			sessionsPerWeek: this.sessionsPerWeek
		};
	}

	/** The prescribed session, or null when the form is incomplete. */
	get plan(): WorkoutPlan | null {
		const input = this.input;
		if (!input) return null;
		return buildWorkoutPlan(input, this.lift, {
			forceExtendedWarmup: this.forceExtendedWarmup,
			backoffMode: this.entry.backoffMode
		});
	}

	/** The forward projection, or an empty list when the form is incomplete. */
	get projection() {
		const input = this.input;
		if (!input) return [];
		return projectSessions(input, this.lift, this.sessionCount, {
			scenario: this.scenario,
			lastSessionDate: this.lastSessionDate
		});
	}

	/** Which lifts the user has already filled in, for the picker's badges. */
	get filledLiftIds(): LiftId[] {
		return LIFTS.filter((lift) => isPositive(this.entries[lift.id].lastTopSetWeight)).map(
			(lift) => lift.id
		);
	}

	selectLift(id: LiftId) {
		this.selectedLiftId = id;
	}

	reset() {
		this.entries = emptyEntries();
		this.forceExtendedWarmup = false;
	}
}

/** The single instance shared by every route. */
export const planner = new PlannerState();
