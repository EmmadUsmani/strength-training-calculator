import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlannerState } from './planner.svelte';
import { STORAGE_KEY_FOR_TESTS, clearSnapshot, loadSnapshot, saveSnapshot } from './storage';

const defaults = () => new PlannerState().toSnapshot();

function filled() {
	const planner = new PlannerState();
	planner.selectLift('ohp');
	planner.entry.lastTopSetWeight = 85;
	planner.entry.backoffWeight = 70;
	planner.entry.backoffSessions = 3;
	return planner;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('storage round-trip', () => {
	it('returns null when nothing has been saved', () => {
		expect(loadSnapshot(defaults())).toBeNull();
	});

	it('saves and restores the form', () => {
		const snapshot = filled().toSnapshot();
		saveSnapshot(snapshot);
		expect(loadSnapshot(defaults())).toEqual(snapshot);
	});

	it('replaces rather than appends — there is no history to accumulate', () => {
		const first = filled();
		saveSnapshot(first.toSnapshot());

		first.entry.lastTopSetWeight = 87.5;
		saveSnapshot(first.toSnapshot());

		// One key, one snapshot, holding only the latest value.
		expect(Object.keys(localStorage)).toEqual([STORAGE_KEY_FOR_TESTS]);
		expect(loadSnapshot(defaults())?.entries.ohp?.lastTopSetWeight).toBe(87.5);
	});

	it('forgets the form on clear', () => {
		saveSnapshot(filled().toSnapshot());
		clearSnapshot();
		expect(loadSnapshot(defaults())).toBeNull();
	});
});

describe('storage resilience', () => {
	it('ignores malformed JSON', () => {
		localStorage.setItem(STORAGE_KEY_FOR_TESTS, '{not json');
		expect(loadSnapshot(defaults())).toBeNull();
	});

	it('ignores a stored value of the wrong shape', () => {
		localStorage.setItem(STORAGE_KEY_FOR_TESTS, '"a string"');
		expect(loadSnapshot(defaults())).toBeNull();
	});

	it('survives a storage that throws on read', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('blocked');
		});
		expect(() => loadSnapshot(defaults())).not.toThrow();
		expect(loadSnapshot(defaults())).toBeNull();
	});

	it('survives a storage that throws on write', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});
		expect(() => saveSnapshot(filled().toSnapshot())).not.toThrow();
	});

	it('survives a storage that throws on clear', () => {
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new DOMException('blocked');
		});
		expect(() => clearSnapshot()).not.toThrow();
	});
});

describe('storage never influences a calculation', () => {
	it('gives the same prescription whether or not a snapshot was restored', () => {
		const typed = filled();

		saveSnapshot(typed.toSnapshot());
		const restored = new PlannerState();
		const snapshot = loadSnapshot(defaults());
		expect(snapshot).not.toBeNull();
		restored.restore(snapshot!);

		expect(restored.plan).toEqual(typed.plan);
		expect(restored.projection).toEqual(typed.projection);
	});

	it('computes normally when storage is entirely unavailable', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('blocked');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('blocked');
		});

		const planner = filled();
		expect(planner.plan?.topSet.weight).toBe(87.5);
		expect(planner.projection).toHaveLength(planner.sessionCount);
	});

	it('is unaffected by junk sitting in storage', () => {
		const clean = filled();
		const expected = clean.plan;

		localStorage.setItem(
			STORAGE_KEY_FOR_TESTS,
			JSON.stringify({ entries: { ohp: { lastTopSetWeight: 999 } } })
		);

		// The planner was never told to restore, so the stored value is inert.
		expect(filled().plan).toEqual(expected);
	});
});
