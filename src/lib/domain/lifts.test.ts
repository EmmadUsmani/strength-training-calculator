import { describe, expect, it } from 'vitest';
import { LIFTS, getLift, isLiftId } from './lifts';

describe('lift registry', () => {
	it('covers the six lifts in the program', () => {
		expect(LIFTS.map((lift) => lift.id)).toEqual([
			'bench',
			'ohp',
			'squat',
			'deadlift',
			'row',
			'curl'
		]);
	});

	it('looks lifts up by id', () => {
		expect(getLift('bench').name).toBe('Bench Press');
	});

	it('throws on an unknown id', () => {
		expect(() => getLift('clean-and-jerk' as never)).toThrow(/Unknown lift/);
	});

	it('narrows valid ids', () => {
		expect(isLiftId('squat')).toBe(true);
		expect(isLiftId('leg-press')).toBe(false);
	});

	it('keeps every warm-up spec self-consistent', () => {
		for (const lift of LIFTS) {
			expect(lift.warmup.percents).toHaveLength(lift.warmup.reps.length);
			expect(lift.warmupExtended.percents).toHaveLength(lift.warmupExtended.reps.length);
			// The longer ramp must actually be longer.
			expect(lift.warmupExtended.percents.length).toBeGreaterThan(lift.warmup.percents.length);
			// Percentages ascend towards the top set.
			expect([...lift.warmup.percents].sort((a, b) => a - b)).toEqual(lift.warmup.percents);
		}
	});

	it('keeps back-offs inside the 80-85% band and descending', () => {
		for (const lift of LIFTS) {
			const percents = lift.backoffs.map((spec) => spec.percent);
			expect(percents.length).toBeGreaterThan(0);
			for (const percent of percents) {
				expect(percent).toBeGreaterThanOrEqual(80);
				expect(percent).toBeLessThanOrEqual(85);
			}
			expect([...percents].sort((a, b) => b - a)).toEqual(percents);
		}
	});

	it('uses a 10% deload and 2.5 lb increments throughout', () => {
		for (const lift of LIFTS) {
			expect(lift.deloadFactor).toBe(0.9);
			expect(lift.increment).toBe(2.5);
			expect(lift.roundTo).toBe(2.5);
		}
	});

	it('only lets the rep model have a moving rep target', () => {
		for (const lift of LIFTS) {
			if (lift.model === 'load') expect(lift.maxTopSetReps).toBe(lift.topSetReps);
			else expect(lift.maxTopSetReps).toBeGreaterThan(lift.topSetReps);
		}
	});
});
