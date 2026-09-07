import { LIFTS, isLiftId } from '$lib/domain/lifts';
import { fromDateInputValue, toDateInputValue } from '$lib/domain/schedule';
import type { BackoffMode, LiftId } from '$lib/domain/types';
import type { LiftEntry } from './planner.svelte';
import type { ProjectionScenario } from '$lib/domain/projection';

/**
 * A JSON-safe copy of everything the user has typed.
 *
 * This is deliberately a flat snapshot of the *current* form, not a log. There
 * is no list of past sessions here and nothing accumulates: saving replaces the
 * previous snapshot outright. Restoring it re-fills the form and nothing else —
 * every prescription is still computed from the form as it stands, so the
 * calculator behaves identically whether or not anything was restored.
 */
export interface PlannerSnapshot {
	entries: Partial<Record<LiftId, LiftEntry>>;
	selectedLiftId: LiftId;
	forceExtendedWarmup: boolean;
	sessionsPerWeek: number;
	/** ISO calendar date, e.g. "2026-09-07". */
	lastSessionDate: string;
	scenario: ProjectionScenario;
	sessionCount: number;
}

const BACKOFF_MODES: BackoffMode[] = ['auto', 'hold', 'recalculate'];
const SCENARIOS: ProjectionScenario[] = ['clean', 'alternating', 'stall'];

/** Largest values we will accept back from storage, to keep the form sane. */
const LIMITS = {
	weight: 2000,
	reps: 100,
	backoffSessions: 52,
	sessionsPerWeek: 7,
	sessionCount: 52
};

/**
 * Validate an untrusted value — anything read back out of storage, which the
 * user could have edited by hand — into a snapshot.
 *
 * Anything unrecognised is dropped rather than repaired, and a field that fails
 * validation falls back to the caller's default. A partially valid snapshot is
 * still worth restoring; only a wholly unusable one returns null.
 */
export function parseSnapshot(raw: unknown, fallback: PlannerSnapshot): PlannerSnapshot | null {
	if (!isRecord(raw)) return null;

	return {
		entries: parseEntries(raw.entries, fallback.entries),
		selectedLiftId:
			typeof raw.selectedLiftId === 'string' && isLiftId(raw.selectedLiftId)
				? raw.selectedLiftId
				: fallback.selectedLiftId,
		forceExtendedWarmup:
			typeof raw.forceExtendedWarmup === 'boolean'
				? raw.forceExtendedWarmup
				: fallback.forceExtendedWarmup,
		sessionsPerWeek:
			parseNumber(raw.sessionsPerWeek, { min: 0.25, max: LIMITS.sessionsPerWeek }) ??
			fallback.sessionsPerWeek,
		lastSessionDate:
			typeof raw.lastSessionDate === 'string' && fromDateInputValue(raw.lastSessionDate)
				? raw.lastSessionDate
				: fallback.lastSessionDate,
		scenario: SCENARIOS.includes(raw.scenario as ProjectionScenario)
			? (raw.scenario as ProjectionScenario)
			: fallback.scenario,
		sessionCount:
			parseInteger(raw.sessionCount, { min: 1, max: LIMITS.sessionCount }) ??
			fallback.sessionCount
	};
}

function parseEntries(
	raw: unknown,
	fallback: Partial<Record<LiftId, LiftEntry>>
): Partial<Record<LiftId, LiftEntry>> {
	if (!isRecord(raw)) return fallback;

	const entries: Partial<Record<LiftId, LiftEntry>> = {};
	for (const lift of LIFTS) {
		const stored = raw[lift.id];
		const base = fallback[lift.id];
		if (!isRecord(stored) || !base) continue;

		entries[lift.id] = {
			lastTopSetWeight:
				parseNullableNumber(stored.lastTopSetWeight, { min: 0, max: LIMITS.weight }) ??
				base.lastTopSetWeight,
			lastTopSetReps:
				parseNullableInteger(stored.lastTopSetReps, { min: 0, max: LIMITS.reps }) ??
				base.lastTopSetReps,
			grindy: typeof stored.grindy === 'boolean' ? stored.grindy : base.grindy,
			previousSessionMissed:
				typeof stored.previousSessionMissed === 'boolean'
					? stored.previousSessionMissed
					: base.previousSessionMissed,
			backoffWeight:
				parseNullableNumber(stored.backoffWeight, { min: 0, max: LIMITS.weight }) ??
				base.backoffWeight,
			backoffReps:
				parseNullableInteger(stored.backoffReps, { min: 0, max: LIMITS.reps }) ??
				base.backoffReps,
			backoffSessions:
				parseNullableInteger(stored.backoffSessions, { min: 1, max: LIMITS.backoffSessions }) ??
				base.backoffSessions,
			backoffMode: BACKOFF_MODES.includes(stored.backoffMode as BackoffMode)
				? (stored.backoffMode as BackoffMode)
				: base.backoffMode
		};
	}

	return { ...fallback, ...entries };
}

/** `null` is a meaningful value here — an empty field — so it round-trips. */
function parseNullableNumber(
	value: unknown,
	bounds: { min: number; max: number }
): number | null | undefined {
	if (value === null) return null;
	return parseNumber(value, bounds);
}

function parseNullableInteger(
	value: unknown,
	bounds: { min: number; max: number }
): number | null | undefined {
	if (value === null) return null;
	return parseInteger(value, bounds);
}

function parseNumber(value: unknown, bounds: { min: number; max: number }): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
	if (value < bounds.min || value > bounds.max) return undefined;
	return value;
}

function parseInteger(value: unknown, bounds: { min: number; max: number }): number | undefined {
	const parsed = parseNumber(value, bounds);
	return parsed === undefined ? undefined : Math.round(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Serialise a date the way `<input type="date">` expects it. */
export const serialiseDate = toDateInputValue;

/** Parse a stored date back, falling back to the supplied default. */
export function deserialiseDate(value: string, fallback: Date): Date {
	return fromDateInputValue(value) ?? fallback;
}
