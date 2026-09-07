/**
 * Core domain types for the training calculator.
 *
 * The whole app is a pure function of a `LiftInput` plus a static `LiftConfig`:
 * nothing here reads from the network, disk, browser storage or the DOM, and
 * nothing is remembered between renders. All weights are in pounds.
 */

export type LiftId = 'bench' | 'ohp' | 'squat' | 'deadlift' | 'row' | 'curl';

/** Which progression rules govern a lift. */
export type ProgressionModel =
	/** Weight moves when the rep target is hit cleanly (bench, OHP, squat, deadlift, row). */
	| 'load'
	/** Reps climb first, then weight resets the ladder (barbell curl). */
	| 'rep';

/** How the previous session's top set went, derived from the reps you logged. */
export type TopSetOutcome =
	/** Hit every target rep with good bar speed and form. */
	| 'clean'
	/** Hit the target reps, but you flagged them as a grind. */
	| 'grind'
	/** Came up short of the rep target. */
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

/**
 * What you did on the back-off sets last session, and how long that back-off
 * weight has been in place. Null when there is no block running yet.
 */
export interface BackoffInput {
	/** The heaviest back-off weight you used last session. */
	weight: number;
	/** Reps you completed on those back-off sets. */
	reps: number;
	/** How many sessions you have now used this back-off weight, including the last one. */
	sessionsUsed: number;
}

/** Whether to hold the current back-off block or recalculate it. */
export type BackoffMode =
	/** Apply the movement and time triggers automatically. */
	| 'auto'
	/** Keep the current back-off weights regardless. */
	| 'hold'
	/** Recalculate from today's top set regardless. */
	| 'recalculate';

/** The user's report of their last session for one lift. */
export interface LiftInput {
	/** Top set weight used last session. */
	lastTopSetWeight: number;
	/** Reps completed on that top set. */
	lastTopSetReps: number;
	/** You hit the reps, but the last one or two were a fight. */
	grindy: boolean;
	/** Whether the session *before* that one also missed the rep target. */
	previousSessionMissed: boolean;
	/** The back-off block currently running, or null to calculate one fresh. */
	backoff: BackoffInput | null;
	/** Sessions of this lift per week; drives the time-based recalculation fallback. */
	sessionsPerWeek: number;
}

/** What the progression rules decided for the upcoming top set. */
export interface TopSetPrescription {
	weight: number;
	targetReps: number;
	action: ProgressionAction;
	/** The outcome derived from the reps you logged. */
	outcome: TopSetOutcome;
	/** Plain-English justification, shown in the UI. */
	rationale: string;
	/** Change in top set weight versus last session (may be negative). */
	weightDelta: number;
}

/** Why the back-off block was held or recalculated. */
export type BackoffTrigger =
	/** The top set has moved far enough past the anchor. */
	| 'movement'
	/** The block has been in place long enough. */
	| 'sessions'
	/** No block was running, so one was calculated fresh. */
	| 'no-history'
	/** The top set deloaded, so the block resets with it. */
	| 'deload'
	/** The user overrode the automatic decision. */
	| 'manual';

/** The decision about this session's back-off weights. */
export interface BackoffDecision {
	/** Whether the block resets to today's top set. */
	recalculate: boolean;
	/** The mode that produced this decision. */
	mode: BackoffMode;
	/** What tipped it, or null when the block is simply being held. */
	trigger: BackoffTrigger | null;
	/** Plain-English explanation, shown in the UI. */
	reason: string;
	/** The top set weight the current back-off weight implies. */
	anchor: number | null;
	/** How far the new top set has moved past that anchor. */
	movement: number | null;
	/** Sessions after which the time-based fallback fires. */
	sessionLimit: number;
	/** Sessions the current block has already run. */
	sessionsUsed: number;
}

/** A complete prescribed session for one lift. */
export interface WorkoutPlan {
	lift: LiftConfig;
	input: LiftInput;
	topSet: TopSetPrescription;
	backoff: BackoffDecision;
	sets: PrescribedSet[];
	/** Advisory notes specific to this session. */
	notes: string[];
}

/** A back-off set template, expressed relative to the top set. */
export interface BackoffSpec {
	percent: number;
	/** Reps prescribed on a freshly recalculated block. */
	minReps: number;
	/** Rep ceiling; reps climb to here before the weight moves. */
	maxReps: number;
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
	finisher?: { percent: number; reps: string };
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
