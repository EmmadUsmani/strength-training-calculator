/**
 * Core domain types for the training calculator.
 *
 * The whole app is a pure function of a small `LiftInput` plus a static
 * `LiftConfig`: nothing here reads from the network, disk or the DOM.
 * All weights are in pounds.
 */

export type LiftId = 'bench' | 'ohp' | 'squat' | 'deadlift' | 'row' | 'curl';

/** Which progression rules govern a lift. */
export type ProgressionModel =
	/** Weight moves when the rep target is hit cleanly (bench, OHP, squat, deadlift, row). */
	| 'load'
	/** Reps climb first, then weight resets the ladder (barbell curl). */
	| 'rep';

/** How the previous session's top set actually went. */
export type TopSetOutcome =
	/** Hit every target rep with good bar speed and form. */
	| 'clean'
	/** Hit the target reps, but the last rep or two were a grind. */
	| 'grind'
	/** Missed the rep target. */
	| 'miss';

/** What the calculator decided to do with the top set this session. */
export type ProgressionAction =
	/** Add the lift's load increment. */
	| 'advance-load'
	/** Same weight, one more rep on the target (rep-model lifts only). */
	| 'advance-reps'
	/** Repeat the same top set weight and target. */
	| 'hold'
	/** Second consecutive miss: cut the weight and rebuild. */
	| 'deload';

/** The role a prescribed set plays in the session. */
export type SetKind = 'warmup' | 'top' | 'backoff' | 'finisher';

/** A single prescribed set of a workout. */
export interface PrescribedSet {
	kind: SetKind;
	/** Display label, e.g. "Warm-up 2" or "Top set". */
	label: string;
	/** Prescribed load, or null for a set where you pick the weight (accessories). */
	weight: number | null;
	/** Prescribed reps, e.g. "5", "6-8" or "max". */
	reps: string;
	/** Percentage of the top set weight, or null when not load-anchored. */
	percentOfTop: number | null;
	/** Rest before the *next* set, as a display string. */
	rest: string;
	/** Exercise name when it differs from the main lift (e.g. a dumbbell finisher). */
	exercise?: string;
	/** Optional sets may be dropped when recovery is poor. */
	optional?: boolean;
}

/** The user's report of their last session for one lift. */
export interface LiftInput {
	/** Top set weight used last session. */
	lastTopSetWeight: number;
	/** How that top set went. */
	outcome: TopSetOutcome;
	/** Whether the session *before* that one was also a miss. */
	previousSessionMissed: boolean;
	/**
	 * Reps completed on the last top set. Only meaningful for `rep`-model
	 * lifts, where the target itself moves between sessions.
	 */
	lastTopSetReps?: number;
}

/** What the progression rules decided for the upcoming top set. */
export interface TopSetPrescription {
	weight: number;
	targetReps: number;
	action: ProgressionAction;
	/** Plain-English justification, shown in the UI. */
	rationale: string;
	/** Change in top set weight versus last session (may be negative). */
	weightDelta: number;
}

/** A complete prescribed session for one lift. */
export interface WorkoutPlan {
	lift: LiftConfig;
	input: LiftInput;
	topSet: TopSetPrescription;
	sets: PrescribedSet[];
	/** Advisory notes specific to this session. */
	notes: string[];
}

/** A back-off set template, expressed relative to the top set. */
export interface BackoffSpec {
	percent: number;
	reps: string;
	optional?: boolean;
}

/** A warm-up ramp template, relative to the top set. */
export interface WarmupSpec {
	/** Percentages of the top set, ascending. The empty-bar set is added separately. */
	percents: number[];
	/** Reps for each entry in `percents`; same length. */
	reps: string[];
}

/** An accessory exercise appended after the main work. */
export interface AccessorySpec {
	name: string;
	reps: string;
	rest: string;
}

/** Static per-lift configuration. */
export interface LiftConfig {
	id: LiftId;
	name: string;
	shortName: string;
	model: ProgressionModel;
	/** Smallest loadable jump, in lb. */
	increment: number;
	/** Rounding granularity for derived weights, in lb. */
	roundTo: number;
	/** Weight of the empty bar used for the first warm-up set, in lb. */
	barWeight: number;
	/** Rep target for the top set (the starting rung for `rep`-model lifts). */
	topSetReps: number;
	/** Highest rep target before a `rep`-model lift adds weight instead. */
	maxTopSetReps: number;
	/** Fraction of the top set weight kept after two consecutive misses. */
	deloadFactor: number;
	/** Normal warm-up ramp. */
	warmup: WarmupSpec;
	/** Longer ramp used after a deload or a big jump in top set weight. */
	warmupExtended: WarmupSpec;
	/** Back-off sets, in prescribed order. */
	backoffs: BackoffSpec[];
	/** Optional burnout set at the end of the session. */
	finisher?: BackoffSpec;
	/** A separate accessory movement closing out the session. */
	accessory?: AccessorySpec;
	/** Rest before the top set. */
	topSetRest: string;
	/** Rest between back-off sets. */
	backoffRest: string;
	/** Rest between warm-up sets. */
	warmupRest: string;
	/** Notes rendered alongside every plan for this lift. */
	coachingNotes: string[];
}
