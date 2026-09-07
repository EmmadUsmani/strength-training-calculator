import { describe, expect, it } from 'vitest';
import { PlannerState } from './planner.svelte';
import { deserialiseDate, parseSnapshot, serialiseDate } from './snapshot';

function filled() {
	const planner = new PlannerState();
	planner.selectLift('ohp');
	planner.entry.lastTopSetWeight = 85;
	planner.entry.lastTopSetReps = 5;
	planner.entry.backoffWeight = 70;
	planner.entry.backoffReps = 7;
	planner.entry.backoffSessions = 3;
	planner.entry.backoffMode = 'hold';
	planner.sessionsPerWeek = 1.5;
	planner.sessionCount = 12;
	planner.scenario = 'alternating';
	planner.lastSessionDate = new Date(2026, 8, 7);
	return planner;
}

describe('toSnapshot / restore', () => {
	it('round-trips every field', () => {
		const source = filled();
		const target = new PlannerState();
		target.restore(source.toSnapshot());

		expect(target.toSnapshot()).toEqual(source.toSnapshot());
		expect(target.selectedLiftId).toBe('ohp');
		expect(target.entry.backoffMode).toBe('hold');
		expect(target.sessionsPerWeek).toBe(1.5);
		expect(target.lastSessionDate.getTime()).toBe(source.lastSessionDate.getTime());
	});

	it('produces plain JSON, not reactive proxies', () => {
		const snapshot = filled().toSnapshot();
		expect(() => structuredClone(snapshot)).not.toThrow();
		expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
	});

	it('is a flat snapshot of the form, with no session history', () => {
		const snapshot = filled().toSnapshot();
		// Nothing in a snapshot may be a list — a list is how a rolling log would
		// creep in, and the calculator must never see one.
		expect(Object.values(snapshot).some(Array.isArray)) .toBe(false);
		for (const entry of Object.values(snapshot.entries)) {
			expect(Object.values(entry).some(Array.isArray)).toBe(false);
		}
		expect(Object.keys(snapshot).sort()).toEqual([
			'entries',
			'forceExtendedWarmup',
			'lastSessionDate',
			'scenario',
			'selectedLiftId',
			'sessionCount',
			'sessionsPerWeek'
		]);
	});

	it('keeps every lift separate through a round-trip', () => {
		const source = new PlannerState();
		source.selectLift('bench');
		source.entry.lastTopSetWeight = 105;
		source.selectLift('squat');
		source.entry.lastTopSetWeight = 155;

		const target = new PlannerState();
		target.restore(source.toSnapshot());
		expect(target.filledLiftIds).toEqual(['bench', 'squat']);
	});
});

describe('parseSnapshot', () => {
	const fallback = new PlannerState().toSnapshot();

	it('accepts a snapshot it produced itself', () => {
		const snapshot = filled().toSnapshot();
		expect(parseSnapshot(snapshot, fallback)).toEqual(snapshot);
	});

	it('rejects anything that is not an object', () => {
		for (const raw of [null, 'nope', 42, [], undefined]) {
			expect(parseSnapshot(raw, fallback)).toBeNull();
		}
	});

	it('falls back per field rather than discarding the whole snapshot', () => {
		const parsed = parseSnapshot(
			{ selectedLiftId: 'leg-press', sessionsPerWeek: 'often', sessionCount: 12 },
			fallback
		);
		expect(parsed?.selectedLiftId).toBe(fallback.selectedLiftId);
		expect(parsed?.sessionsPerWeek).toBe(fallback.sessionsPerWeek);
		expect(parsed?.sessionCount).toBe(12);
	});

	it('drops unknown lifts and keeps known ones', () => {
		const parsed = parseSnapshot(
			{ entries: { bench: { lastTopSetWeight: 105 }, legPress: { lastTopSetWeight: 300 } } },
			fallback
		);
		expect(parsed?.entries.bench?.lastTopSetWeight).toBe(105);
		expect(parsed?.entries).not.toHaveProperty('legPress');
	});

	it('rejects out-of-range and non-finite numbers', () => {
		const parsed = parseSnapshot(
			{
				entries: {
					bench: {
						lastTopSetWeight: 1e9,
						lastTopSetReps: Number.NaN,
						backoffSessions: -4
					}
				}
			},
			fallback
		);
		expect(parsed?.entries.bench?.lastTopSetWeight).toBe(fallback.entries.bench?.lastTopSetWeight);
		expect(parsed?.entries.bench?.lastTopSetReps).toBe(fallback.entries.bench?.lastTopSetReps);
		expect(parsed?.entries.bench?.backoffSessions).toBe(fallback.entries.bench?.backoffSessions);
	});

	it('round-trips a null (empty) field rather than treating it as invalid', () => {
		const parsed = parseSnapshot({ entries: { bench: { lastTopSetWeight: null } } }, fallback);
		expect(parsed?.entries.bench?.lastTopSetWeight).toBeNull();
	});

	it('rejects an unknown back-off mode or scenario', () => {
		const parsed = parseSnapshot(
			{ scenario: 'wishful', entries: { bench: { backoffMode: 'whatever' } } },
			fallback
		);
		expect(parsed?.scenario).toBe(fallback.scenario);
		expect(parsed?.entries.bench?.backoffMode).toBe('auto');
	});

	it('rejects a malformed date', () => {
		expect(parseSnapshot({ lastSessionDate: '07/09/2026' }, fallback)?.lastSessionDate).toBe(
			fallback.lastSessionDate
		);
	});
});

describe('date serialisation', () => {
	it('round-trips a local date', () => {
		const date = new Date(2026, 8, 7);
		expect(deserialiseDate(serialiseDate(date), new Date(0)).getTime()).toBe(date.getTime());
	});

	it('falls back when the stored value is unusable', () => {
		const fallback = new Date(2026, 0, 1);
		expect(deserialiseDate('garbage', fallback)).toBe(fallback);
	});
});
