import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, OHP, SQUAT } from './lifts';
import { deloadWeight, nextTopSet } from './progression';
import type { LiftInput, TopSetOutcome } from './types';

function input(
	lastTopSetWeight: number,
	outcome: TopSetOutcome,
	previousSessionMissed = false,
	lastTopSetReps?: number
): LiftInput {
	return { lastTopSetWeight, outcome, previousSessionMissed, lastTopSetReps };
}

describe('load-model progression', () => {
	it('adds 2.5 lb after a clean top set', () => {
		const result = nextTopSet(input(82.5, 'clean'), OHP);
		expect(result.weight).toBe(85);
		expect(result.targetReps).toBe(5);
		expect(result.action).toBe('advance-load');
		expect(result.weightDelta).toBe(2.5);
	});

	it('holds the weight when the reps were ground out', () => {
		const result = nextTopSet(input(105, 'grind'), BENCH);
		expect(result.weight).toBe(105);
		expect(result.action).toBe('hold');
		expect(result.weightDelta).toBe(0);
	});

	it('holds the weight after a single miss', () => {
		const result = nextTopSet(input(105, 'miss'), BENCH);
		expect(result.weight).toBe(105);
		expect(result.action).toBe('hold');
	});

	it('deloads 10% after two consecutive misses', () => {
		const result = nextTopSet(input(105, 'miss', true), BENCH);
		// 105 * 0.9 = 94.5, rounded to the nearest 2.5 lb.
		expect(result.weight).toBe(95);
		expect(result.action).toBe('deload');
		expect(result.weightDelta).toBe(-10);
	});

	it('ignores the miss streak when the last session was clean', () => {
		const result = nextTopSet(input(105, 'clean', true), BENCH);
		expect(result.weight).toBe(107.5);
		expect(result.action).toBe('advance-load');
	});

	it('applies the same rules to every load-model lift', () => {
		expect(nextTopSet(input(155, 'clean'), SQUAT).weight).toBe(157.5);
		expect(nextTopSet(input(160, 'clean'), DEADLIFT).weight).toBe(162.5);
	});

	it('always produces a rationale', () => {
		for (const outcome of ['clean', 'grind', 'miss'] as const) {
			expect(nextTopSet(input(100, outcome), BENCH).rationale.length).toBeGreaterThan(20);
		}
	});
});

describe('deloadWeight', () => {
	it('cuts 10% and rounds to a loadable weight', () => {
		expect(deloadWeight(105, BENCH)).toBe(95);
		expect(deloadWeight(90, OHP)).toBe(80);
		expect(deloadWeight(160, DEADLIFT)).toBe(145);
	});

	it('always moves at least one increment, even at light loads', () => {
		expect(deloadWeight(25, OHP)).toBeLessThanOrEqual(22.5);
	});

	it('never drops below the empty bar', () => {
		expect(deloadWeight(20, OHP)).toBe(20);
	});
});

describe('rep-model progression (barbell curl)', () => {
	it('chases one more rep at the same weight after a clean set', () => {
		const result = nextTopSet(input(50, 'clean', false, 8), CURL);
		expect(result.weight).toBe(50);
		expect(result.targetReps).toBe(9);
		expect(result.action).toBe('advance-reps');
	});

	it('adds weight and resets the ladder once the top of the range is clean', () => {
		const result = nextTopSet(input(50, 'clean', false, 12), CURL);
		expect(result.weight).toBe(52.5);
		expect(result.targetReps).toBe(8);
		expect(result.action).toBe('advance-load');
	});

	it('repeats the same rep target after a grind', () => {
		const result = nextTopSet(input(50, 'grind', false, 10), CURL);
		expect(result.weight).toBe(50);
		expect(result.targetReps).toBe(10);
		expect(result.action).toBe('hold');
	});

	it('rebuilds from the bottom of the ladder after two misses', () => {
		const result = nextTopSet(input(60, 'miss', true, 6), CURL);
		expect(result.weight).toBe(55);
		expect(result.targetReps).toBe(CURL.topSetReps);
		expect(result.action).toBe('deload');
	});

	it('defaults to the base rep target when reps are not supplied', () => {
		const result = nextTopSet(input(50, 'clean'), CURL);
		expect(result.targetReps).toBe(CURL.topSetReps + 1);
	});

	it('clamps a nonsense rep count into the ladder', () => {
		expect(nextTopSet(input(50, 'clean', false, 40), CURL).action).toBe('advance-load');
		expect(nextTopSet(input(50, 'clean', false, Number.NaN), CURL).targetReps).toBe(9);
	});

	it('walks the full ladder from 8 reps to a weight increase', () => {
		let current = input(50, 'clean', false, 8);
		const targets: number[] = [];
		for (let i = 0; i < 5; i++) {
			const next = nextTopSet(current, CURL);
			targets.push(next.targetReps);
			current = { ...current, lastTopSetWeight: next.weight, lastTopSetReps: next.targetReps };
		}
		expect(targets).toEqual([9, 10, 11, 12, 8]);
		expect(current.lastTopSetWeight).toBe(52.5);
	});
});
