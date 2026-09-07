import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, OHP, SQUAT } from './lifts';
import { deriveOutcome, deloadWeight, nextTopSet } from './progression';
import { makeInput } from './testing';

describe('deriveOutcome', () => {
	it('reads a clean session off the rep count', () => {
		expect(deriveOutcome(makeInput({ lastTopSetReps: 5 }), BENCH)).toBe('clean');
		expect(deriveOutcome(makeInput({ lastTopSetReps: 7 }), BENCH)).toBe('clean');
	});

	it('reads a miss off the rep count', () => {
		expect(deriveOutcome(makeInput({ lastTopSetReps: 4 }), BENCH)).toBe('miss');
		expect(deriveOutcome(makeInput({ lastTopSetReps: 0 }), BENCH)).toBe('miss');
	});

	it('only counts a grind when the reps were actually hit', () => {
		expect(deriveOutcome(makeInput({ lastTopSetReps: 5, grindy: true }), BENCH)).toBe('grind');
		expect(deriveOutcome(makeInput({ lastTopSetReps: 3, grindy: true }), BENCH)).toBe('miss');
	});

	it('measures the curl against the bottom of its rep ladder', () => {
		expect(deriveOutcome(makeInput({ lastTopSetReps: 8 }), CURL)).toBe('clean');
		expect(deriveOutcome(makeInput({ lastTopSetReps: 11 }), CURL)).toBe('clean');
		expect(deriveOutcome(makeInput({ lastTopSetReps: 7 }), CURL)).toBe('miss');
	});
});

describe('load-model progression', () => {
	it('adds 2.5 lb after a clean top set', () => {
		const result = nextTopSet(makeInput({ lastTopSetWeight: 82.5, lastTopSetReps: 5 }), OHP);
		expect(result.weight).toBe(85);
		expect(result.targetReps).toBe(5);
		expect(result.action).toBe('advance-load');
		expect(result.outcome).toBe('clean');
		expect(result.weightDelta).toBe(2.5);
	});

	it('holds the weight when the reps were ground out', () => {
		const result = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 5, grindy: true }),
			BENCH
		);
		expect(result.weight).toBe(105);
		expect(result.action).toBe('hold');
		expect(result.weightDelta).toBe(0);
	});

	it('holds the weight after a single miss', () => {
		const result = nextTopSet(makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3 }), BENCH);
		expect(result.weight).toBe(105);
		expect(result.action).toBe('hold');
		expect(result.rationale).toContain('3 of 5 reps');
	});

	it('deloads 10% after two consecutive misses', () => {
		const result = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3, previousSessionMissed: true }),
			BENCH
		);
		// 105 * 0.9 = 94.5, rounded to the nearest 2.5 lb.
		expect(result.weight).toBe(95);
		expect(result.action).toBe('deload');
		expect(result.weightDelta).toBe(-10);
	});

	it('ignores the miss streak when the last session hit its reps', () => {
		const result = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 5, previousSessionMissed: true }),
			BENCH
		);
		expect(result.weight).toBe(107.5);
		expect(result.action).toBe('advance-load');
	});

	it('counts extra reps as a clean session, not a bonus', () => {
		const result = nextTopSet(makeInput({ lastTopSetWeight: 105, lastTopSetReps: 8 }), BENCH);
		expect(result.weight).toBe(107.5);
		expect(result.targetReps).toBe(5);
	});

	it('applies the same rules to every load-model lift', () => {
		expect(nextTopSet(makeInput({ lastTopSetWeight: 155 }), SQUAT).weight).toBe(157.5);
		expect(nextTopSet(makeInput({ lastTopSetWeight: 160 }), DEADLIFT).weight).toBe(162.5);
	});

	it('always produces a rationale', () => {
		for (const reps of [5, 3]) {
			for (const grindy of [true, false]) {
				const result = nextTopSet(makeInput({ lastTopSetReps: reps, grindy }), BENCH);
				expect(result.rationale.length).toBeGreaterThan(20);
			}
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
		const result = nextTopSet(makeInput({ lastTopSetWeight: 50, lastTopSetReps: 8 }), CURL);
		expect(result.weight).toBe(50);
		expect(result.targetReps).toBe(9);
		expect(result.action).toBe('advance-reps');
	});

	it('adds weight and resets the ladder once the top of the range is clean', () => {
		const result = nextTopSet(makeInput({ lastTopSetWeight: 50, lastTopSetReps: 12 }), CURL);
		expect(result.weight).toBe(52.5);
		expect(result.targetReps).toBe(8);
		expect(result.action).toBe('advance-load');
	});

	it('repeats the same rep target after a grind', () => {
		const result = nextTopSet(
			makeInput({ lastTopSetWeight: 50, lastTopSetReps: 10, grindy: true }),
			CURL
		);
		expect(result.weight).toBe(50);
		expect(result.targetReps).toBe(10);
		expect(result.action).toBe('hold');
	});

	it('holds at the rep floor after falling short of it', () => {
		const result = nextTopSet(makeInput({ lastTopSetWeight: 60, lastTopSetReps: 6 }), CURL);
		expect(result.weight).toBe(60);
		expect(result.targetReps).toBe(CURL.topSetReps);
		expect(result.action).toBe('hold');
	});

	it('rebuilds from the bottom of the ladder after two short sessions', () => {
		const result = nextTopSet(
			makeInput({ lastTopSetWeight: 60, lastTopSetReps: 6, previousSessionMissed: true }),
			CURL
		);
		expect(result.weight).toBe(55);
		expect(result.targetReps).toBe(CURL.topSetReps);
		expect(result.action).toBe('deload');
	});

	it('clamps a nonsense rep count into the ladder', () => {
		expect(nextTopSet(makeInput({ lastTopSetReps: 40 }), CURL).action).toBe('advance-load');
		expect(nextTopSet(makeInput({ lastTopSetReps: Number.NaN }), CURL).targetReps).toBe(9);
	});

	it('walks the full ladder from 8 reps to a weight increase', () => {
		let current = makeInput({ lastTopSetWeight: 50, lastTopSetReps: 8 });
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
