import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, LIFTS, OHP } from './lifts';
import { buildWorkoutPlan } from './plan';
import type { LiftInput } from './types';

const clean = (weight: number, reps?: number): LiftInput => ({
	lastTopSetWeight: weight,
	outcome: 'clean',
	previousSessionMissed: false,
	lastTopSetReps: reps
});

describe('buildWorkoutPlan', () => {
	it('reproduces the prescribed OHP session from the research', () => {
		const plan = buildWorkoutPlan(clean(82.5), OHP);
		expect(plan.topSet.weight).toBe(85);
		expect(plan.sets.map((set) => `${set.label} ${set.weight} x ${set.reps}`)).toEqual([
			'Warm-up 1 20 x 8-10',
			'Warm-up 2 50 x 5',
			'Warm-up 3 70 x 2-3',
			'Top set 85 x 5',
			'Back-off 1 70 x 6-8',
			'Back-off 2 70 x 6-8',
			'Back-off 3 67.5 x 6-8',
			'Drop set 47.5 x max'
		]);
	});

	it('holds bench at the missed weight rather than advancing', () => {
		const plan = buildWorkoutPlan(
			{ lastTopSetWeight: 105, outcome: 'miss', previousSessionMissed: false },
			BENCH
		);
		expect(plan.topSet.weight).toBe(105);
		expect(plan.topSet.action).toBe('hold');
		expect(plan.notes.join(' ')).toContain('10%');
	});

	it('orders sets warm-up, top, back-off, finisher', () => {
		for (const lift of LIFTS) {
			const kinds = buildWorkoutPlan(clean(100), lift).sets.map((set) => set.kind);
			const firstTop = kinds.indexOf('top');
			expect(firstTop).toBeGreaterThan(0);
			expect(kinds.slice(0, firstTop).every((kind) => kind === 'warmup')).toBe(true);
			expect(kinds.filter((kind) => kind === 'top')).toHaveLength(1);
			expect(kinds.slice(firstTop + 1).every((kind) => kind !== 'warmup')).toBe(true);
		}
	});

	it('prescribes exactly one top set for every lift', () => {
		for (const lift of LIFTS) {
			const plan = buildWorkoutPlan(clean(100), lift);
			expect(plan.sets.filter((set) => set.kind === 'top')).toHaveLength(1);
		}
	});

	it('never lets a non-top set exceed the top set weight', () => {
		for (const lift of LIFTS) {
			const plan = buildWorkoutPlan(clean(100), lift);
			for (const set of plan.sets) {
				if (set.kind === 'top' || set.weight === null) continue;
				expect(set.weight).toBeLessThan(plan.topSet.weight);
			}
		}
	});

	it('switches to the longer ramp after a deload', () => {
		const short = buildWorkoutPlan(clean(105), BENCH).sets.filter((s) => s.kind === 'warmup');
		const afterDeload = buildWorkoutPlan(
			{ lastTopSetWeight: 105, outcome: 'miss', previousSessionMissed: true },
			BENCH
		);
		expect(afterDeload.topSet.action).toBe('deload');
		expect(afterDeload.sets.filter((s) => s.kind === 'warmup').length).toBe(short.length + 1);
		expect(afterDeload.notes.join(' ')).toContain('longer warm-up');
	});

	it('honours a forced extended ramp', () => {
		const normal = buildWorkoutPlan(clean(105), BENCH).sets.filter((s) => s.kind === 'warmup');
		const forced = buildWorkoutPlan(clean(105), BENCH, { forceExtendedWarmup: true }).sets.filter(
			(s) => s.kind === 'warmup'
		);
		expect(forced.length).toBe(normal.length + 1);
	});

	it('closes the curl session with the dumbbell finisher', () => {
		const plan = buildWorkoutPlan(clean(50, 8), CURL);
		expect(plan.topSet.targetReps).toBe(9);
		expect(plan.sets.at(-1)?.exercise).toBe('Dumbbell Curl');
	});

	it('marks the deadlift back-off optional', () => {
		const plan = buildWorkoutPlan(clean(160), DEADLIFT);
		const backoff = plan.sets.find((set) => set.kind === 'backoff');
		expect(backoff?.optional).toBe(true);
	});

	it('carries the input through onto the plan', () => {
		const input = clean(82.5);
		const plan = buildWorkoutPlan(input, OHP);
		expect(plan.input).toBe(input);
		expect(plan.lift).toBe(OHP);
	});
});
