import { browser } from '$app/environment';
import { LIFTS, getLift, isLiftId } from '$lib/domain/lifts';
import { buildWorkoutPlan } from '$lib/domain/plan';
import { projectSessions, type ProjectionScenario } from '$lib/domain/projection';
import type { LiftId, LiftInput, TopSetOutcome, WorkoutPlan } from '$lib/domain/types';

const STORAGE_KEY = 'stc:planner';

/** What the user reported for one lift. `null` weight means "not filled in yet". */
export interface LiftEntry {
	lastTopSetWeight: number | null;
	lastTopSetReps: number | null;
	outcome: TopSetOutcome;
	previousSessionMissed: boolean;
}

interface PersistedState {
	entries: Record<string, LiftEntry>;
	selectedLiftId: string;
	forceExtendedWarmup: boolean;
	scenario: string;
	sessionCount: number;
}

function emptyEntry(liftId: LiftId): LiftEntry {
	return {
		lastTopSetWeight: null,
		lastTopSetReps: getLift(liftId).topSetReps,
		outcome: 'clean',
		previousSessionMissed: false
	};
}

function emptyEntries(): Record<LiftId, LiftEntry> {
	return Object.fromEntries(LIFTS.map((lift) => [lift.id, emptyEntry(lift.id)])) as Record<
		LiftId,
		LiftEntry
	>;
}

/**
 * Shared calculator state.
 *
 * The three pages are all views over the same handful of inputs, so the state
 * lives here rather than in any one route. It is mirrored into sessionStorage
 * purely so a reload or a deep link does not wipe what you typed — the app
 * still computes everything from scratch on every render.
 */
export class PlannerState {
	entries = $state<Record<LiftId, LiftEntry>>(emptyEntries());
	selectedLiftId = $state<LiftId>('bench');
	forceExtendedWarmup = $state(false);
	scenario = $state<ProjectionScenario>('clean');
	sessionCount = $state(8);

	/** Set once `hydrate()` has run, so `persist()` cannot overwrite a stored
	 * snapshot with the defaults before it has been read back. */
	#hydrated = false;

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
		const weight = this.entry.lastTopSetWeight;
		return weight !== null && Number.isFinite(weight) && weight > 0;
	}

	/** The normalised domain input, or null when the form is incomplete. */
	get input(): LiftInput | null {
		if (!this.hasInput) return null;
		const entry = this.entry;
		return {
			lastTopSetWeight: entry.lastTopSetWeight as number,
			outcome: entry.outcome,
			previousSessionMissed: entry.outcome === 'miss' && entry.previousSessionMissed,
			lastTopSetReps: entry.lastTopSetReps ?? undefined
		};
	}

	/** The prescribed session, or null when the form is incomplete. */
	get plan(): WorkoutPlan | null {
		const input = this.input;
		if (!input) return null;
		return buildWorkoutPlan(input, this.lift, {
			forceExtendedWarmup: this.forceExtendedWarmup
		});
	}

	/** The forward projection, or an empty list when the form is incomplete. */
	get projection() {
		const input = this.input;
		if (!input) return [];
		return projectSessions(input, this.lift, this.sessionCount, this.scenario);
	}

	/** Which lifts the user has already filled in, for the picker's badges. */
	get filledLiftIds(): LiftId[] {
		return LIFTS.filter((lift) => {
			const weight = this.entries[lift.id].lastTopSetWeight;
			return weight !== null && weight > 0;
		}).map((lift) => lift.id);
	}

	selectLift(id: LiftId) {
		this.selectedLiftId = id;
	}

	reset() {
		this.entries = emptyEntries();
		this.forceExtendedWarmup = false;
	}

	/** Read any previously typed inputs back out of sessionStorage. */
	hydrate() {
		if (!browser || this.#hydrated) return;
		this.#hydrated = true;
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<PersistedState>;
			if (parsed.entries) {
				for (const lift of LIFTS) {
					const entry = parsed.entries[lift.id];
					if (entry) this.entries[lift.id] = { ...emptyEntry(lift.id), ...entry };
				}
			}
			if (typeof parsed.selectedLiftId === 'string' && isLiftId(parsed.selectedLiftId)) {
				this.selectedLiftId = parsed.selectedLiftId;
			}
			if (typeof parsed.forceExtendedWarmup === 'boolean') {
				this.forceExtendedWarmup = parsed.forceExtendedWarmup;
			}
			if (typeof parsed.sessionCount === 'number') this.sessionCount = parsed.sessionCount;
			if (parsed.scenario === 'clean' || parsed.scenario === 'alternating' || parsed.scenario === 'stall') {
				this.scenario = parsed.scenario;
			}
		} catch {
			// A malformed or unavailable store is not worth failing the page over.
		}
	}

	/** Mirror the current inputs into sessionStorage. */
	persist() {
		if (!browser || !this.#hydrated) return;
		try {
			const snapshot: PersistedState = {
				entries: $state.snapshot(this.entries),
				selectedLiftId: this.selectedLiftId,
				forceExtendedWarmup: this.forceExtendedWarmup,
				scenario: this.scenario,
				sessionCount: this.sessionCount
			};
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			// Private browsing and full quotas both land here; neither is fatal.
		}
	}
}

/** The single instance shared by every route. */
export const planner = new PlannerState();
