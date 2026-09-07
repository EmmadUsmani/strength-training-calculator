import { describe, expect, it } from 'vitest';
import { BENCH, CURL, OHP, SQUAT } from './lifts';
import { BIG_JUMP_LB, buildWarmup, needsExtendedWarmup } from './warmup';

describe('buildWarmup', () => {
	it('gives the presses three sets, opening with the empty bar', () => {
		const sets = buildWarmup(85, OHP);
		expect(sets).toHaveLength(3);
		expect(sets.map((set) => set.weight)).toEqual([20, 50, 70]);
		expect(sets[0].reps).toBe('8-10');
	});

	it('matches the worked bench example from the research', () => {
		const sets = buildWarmup(105, BENCH);
		expect(sets.map((set) => set.weight)).toEqual([20, 60, 85]);
	});

	it('lands the last warm-up 10-20 lb under the top set', () => {
		for (const top of [85, 95, 105, 110]) {
			const sets = buildWarmup(top, BENCH);
			const gap = top - (sets.at(-1)?.weight ?? 0);
			expect(gap).toBeGreaterThanOrEqual(10);
			expect(gap).toBeLessThanOrEqual(20);
		}
	});

	it('gives squat and deadlift four sets', () => {
		const sets = buildWarmup(155, SQUAT);
		expect(sets).toHaveLength(4);
		expect(sets.map((set) => set.weight)).toEqual([20, 70, 100, 125]);
	});

	it('ramps with descending reps', () => {
		expect(buildWarmup(155, SQUAT).map((set) => set.reps)).toEqual(['8-10', '5', '3', '2']);
	});

	it('adds a step when extended', () => {
		expect(buildWarmup(85, OHP, { extended: true })).toHaveLength(4);
		expect(buildWarmup(155, SQUAT, { extended: true })).toHaveLength(5);
	});

	it('rests longest before the top set', () => {
		const sets = buildWarmup(85, OHP);
		expect(sets.at(-1)?.rest).toBe(OHP.topSetRest);
		expect(sets[0].rest).toBe(OHP.warmupRest);
	});

	it('keeps every warm-up strictly between the bar and the top set', () => {
		for (const top of [25, 30, 45, 60, 200]) {
			for (const set of buildWarmup(top, BENCH)) {
				expect(set.weight).toBeGreaterThanOrEqual(BENCH.barWeight);
				expect(set.weight).toBeLessThanOrEqual(top);
			}
		}
	});

	it('collapses to the bar alone when the top set is barely loaded', () => {
		expect(buildWarmup(22.5, OHP).map((set) => set.weight)).toEqual([20]);
	});

	it('never repeats a weight after rounding', () => {
		for (const top of [22.5, 25, 27.5, 30, 35, 40]) {
			const weights = buildWarmup(top, OHP, { extended: true }).map((set) => set.weight);
			expect(new Set(weights).size).toBe(weights.length);
		}
	});

	it('gives the curl a two-set ramp', () => {
		const sets = buildWarmup(55, CURL);
		expect(sets.map((set) => set.weight)).toEqual([20, 35]);
	});

	it('reports each set as a percentage of the top set', () => {
		const sets = buildWarmup(100, BENCH);
		expect(sets.map((set) => set.percentOfTop)).toEqual([20, 58, 83]);
	});
});

describe('needsExtendedWarmup', () => {
	it('fires after a deload', () => {
		expect(needsExtendedWarmup(-10, true)).toBe(true);
	});

	it('fires on a big jump', () => {
		expect(needsExtendedWarmup(BIG_JUMP_LB, false)).toBe(true);
	});

	it('stays off for a normal 2.5 lb session', () => {
		expect(needsExtendedWarmup(2.5, false)).toBe(false);
		expect(needsExtendedWarmup(0, false)).toBe(false);
	});
});
