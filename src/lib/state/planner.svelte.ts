import { getContext, setContext } from 'svelte';
import { LIFTS, getLift } from '$lib/domain/lifts';
import { buildWorkoutPlan } from '$lib/domain/plan';
import { projectSessions, type ProjectionScenario } from '$lib/domain/projection';
import { DEFAULT_SESSIONS_PER_WEEK, today } from '$lib/domain/schedule';
import type { BackoffMode, LiftId, LiftInput, WorkoutPlan } from '$lib/domain/types';
import { deserialiseDate, serialiseDate, type PlannerSnapshot } from './snapshot';

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
 * The three pages are all views over the same handful of inputs, so one
 * instance is attached to the component tree in the root layout and read back
 * out of context by each page (see `setPlanner` / `getPlanner`). That gives one
 * instance per render rather than one per process, so nothing would leak
 * between users if this ever gained a server — the hazard a module-level
 * singleton carries.
 *
 * The form is mirrored into `localStorage` between visits so you do not retype
 * it every session, but that is purely a convenience: `toSnapshot` and
 * `restore` move values in and out of the form fields, and nothing else reads
 * them. Every prescription is computed from the form as it stands, so a
 * restored session and a hand-typed one give identical results.
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

	/**
	 * A JSON-safe copy of the current form. A flat snapshot of what is on screen
	 * right now — never a log of past sessions.
	 */
	toSnapshot(): PlannerSnapshot {
		return {
			entries: $state.snapshot(this.entries),
			selectedLiftId: this.selectedLiftId,
			forceExtendedWarmup: this.forceExtendedWarmup,
			sessionsPerWeek: this.sessionsPerWeek,
			lastSessionDate: serialiseDate(this.lastSessionDate),
			scenario: this.scenario,
			sessionCount: this.sessionCount
		};
	}

	/** Re-fill the form from a snapshot. Touches nothing but the input fields. */
	restore(snapshot: PlannerSnapshot): void {
		for (const lift of LIFTS) {
			const entry = snapshot.entries[lift.id];
			if (entry) this.entries[lift.id] = { ...emptyEntry(lift.id), ...entry };
		}
		this.selectedLiftId = snapshot.selectedLiftId;
		this.forceExtendedWarmup = snapshot.forceExtendedWarmup;
		this.sessionsPerWeek = snapshot.sessionsPerWeek;
		this.lastSessionDate = deserialiseDate(snapshot.lastSessionDate, this.lastSessionDate);
		this.scenario = snapshot.scenario;
		this.sessionCount = snapshot.sessionCount;
	}
}

const PLANNER_KEY = Symbol('planner');

/**
 * Create the planner for this render and attach it to the component tree.
 * Called once, in the root layout; must run during component initialisation.
 */
export function setPlanner(): PlannerState {
	return setContext(PLANNER_KEY, new PlannerState());
}

/**
 * The planner for the current component tree. Must be called during component
 * initialisation, not from an event handler or an effect.
 */
export function getPlanner(): PlannerState {
	const planner = getContext<PlannerState | undefined>(PLANNER_KEY);
	if (!planner) {
		throw new Error('getPlanner() was called outside a tree that ran setPlanner()');
	}
	return planner;
}
