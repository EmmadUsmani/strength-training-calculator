import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, LIFTS, OHP } from './lifts';
import { buildWorkoutPlan } from './plan';
import { makeInput } from './testing';
import type { BackoffInput } from './types';

const block = (weight: number, reps = 6, sessionsUsed = 1): BackoffInput => ({
	weight,
	reps,
	sessionsUsed
});

describe('buildWorkoutPlan', () => {
	it('reproduces the prescribed OHP session from the research', () => {
		const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 82.5, lastTopSetReps: 5 }), OHP);
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

	it('holds the logged back-off block while the top set climbs', () => {
		const plan = buildWorkoutPlan(
			makeInput({ lastTopSetWeight: 82.5, lastTopSetReps: 5, backoff: block(70, 6, 2) }),
			OHP
		);
		expect(plan.backoff.recalculate).toBe(false);
		expect(plan.sets.filter((set) => set.kind === 'backoff').map((set) => set.weight)).toEqual([
			70, 67.5, 65
		]);
		expect(plan.sets.find((set) => set.kind === 'backoff')?.reps).toBe('7');
	});

	it('resets the block once the top set has run away from it', () => {
		const plan = buildWorkoutPlan(
			makeInput({ lastTopSetWeight: 90, lastTopSetReps: 5, backoff: block(70, 8, 3) }),
			OHP
		);
		expect(plan.backoff.recalculate).toBe(true);
		expect(plan.backoff.trigger).toBe('movement');
		expect(plan.sets.find((set) => set.kind === 'backoff')?.weight).toBe(77.5);
		expect(plan.notes.join(' ')).toContain('session 1 of the new back-off block');
	});

	it('honours a manual hold', () => {
		const input = makeInput({
			lastTopSetWeight: 90,
			lastTopSetReps: 5,
			backoff: block(70, 8, 3)
		});
		const plan = buildWorkoutPlan(input, OHP, { backoffMode: 'hold' });
		expect(plan.backoff.recalculate).toBe(false);
		expect(plan.sets.find((set) => set.kind === 'backoff')?.weight).toBe(70);
	});

	it('honours a manual reset', () => {
		const input = makeInput({
			lastTopSetWeight: 82.5,
			lastTopSetReps: 5,
			backoff: block(70, 6, 1)
		});
		const plan = buildWorkoutPlan(input, OHP, { backoffMode: 'recalculate' });
		expect(plan.backoff.recalculate).toBe(true);
		expect(plan.backoff.trigger).toBe('manual');
	});

	it('holds bench at the missed weight rather than advancing', () => {
		const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3 }), BENCH);
		expect(plan.topSet.weight).toBe(105);
		expect(plan.topSet.action).toBe('hold');
		expect(plan.notes.join(' ')).toContain('10%');
	});

	it('orders sets warm-up, top, back-off, finisher', () => {
		for (const lift of LIFTS) {
			const kinds = buildWorkoutPlan(makeInput(), lift).sets.map((set) => set.kind);
			const firstTop = kinds.indexOf('top');
			expect(firstTop).toBeGreaterThan(0);
			expect(kinds.slice(0, firstTop).every((kind) => kind === 'warmup')).toBe(true);
			expect(kinds.filter((kind) => kind === 'top')).toHaveLength(1);
			expect(kinds.slice(firstTop + 1).every((kind) => kind !== 'warmup')).toBe(true);
		}
	});

	it('prescribes exactly one top set for every lift', () => {
		for (const lift of LIFTS) {
			const plan = buildWorkoutPlan(makeInput({ lastTopSetReps: lift.topSetReps }), lift);
			expect(plan.sets.filter((set) => set.kind === 'top')).toHaveLength(1);
		}
	});

	it('never lets a non-top set exceed the top set weight', () => {
		for (const lift of LIFTS) {
			const plan = buildWorkoutPlan(
				makeInput({ lastTopSetReps: lift.topSetReps, backoff: block(95, 6, 1) }),
				lift
			);
			for (const set of plan.sets) {
				if (set.kind === 'top' || set.weight === null) continue;
				expect(set.weight).toBeLessThan(plan.topSet.weight);
			}
		}
	});

	it('switches to the longer ramp after a deload', () => {
		const short = buildWorkoutPlan(makeInput({ lastTopSetWeight: 105 }), BENCH).sets.filter(
			(s) => s.kind === 'warmup'
		);
		const afterDeload = buildWorkoutPlan(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3, previousSessionMissed: true }),
			BENCH
		);
		expect(afterDeload.topSet.action).toBe('deload');
		expect(afterDeload.sets.filter((s) => s.kind === 'warmup').length).toBe(short.length + 1);
		expect(afterDeload.notes.join(' ')).toContain('longer warm-up');
	});

	it('resets the back-off block alongside a deload', () => {
		const plan = buildWorkoutPlan(
			makeInput({
				lastTopSetWeight: 105,
				lastTopSetReps: 3,
				previousSessionMissed: true,
				backoff: block(90, 8, 2)
			}),
			BENCH
		);
		expect(plan.backoff.trigger).toBe('deload');
		expect(plan.backoff.recalculate).toBe(true);
	});

	it('honours a forced extended ramp', () => {
		const normal = buildWorkoutPlan(makeInput({ lastTopSetWeight: 105 }), BENCH).sets.filter(
			(s) => s.kind === 'warmup'
		);
		const forced = buildWorkoutPlan(makeInput({ lastTopSetWeight: 105 }), BENCH, {
			forceExtendedWarmup: true
		}).sets.filter((s) => s.kind === 'warmup');
		expect(forced.length).toBe(normal.length + 1);
	});

	it('closes the curl session with the dumbbell finisher', () => {
		const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 50, lastTopSetReps: 8 }), CURL);
		expect(plan.topSet.targetReps).toBe(9);
		expect(plan.sets.at(-1)?.exercise).toBe('Dumbbell Curl');
	});

	it('marks the deadlift back-off optional', () => {
		const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 160 }), DEADLIFT);
		const backoff = plan.sets.find((set) => set.kind === 'backoff');
		expect(backoff?.optional).toBe(true);
	});

	it('carries the input through onto the plan', () => {
		const input = makeInput({ lastTopSetWeight: 82.5 });
		const plan = buildWorkoutPlan(input, OHP);
		expect(plan.input).toBe(input);
		expect(plan.lift).toBe(OHP);
	});

	it('always explains the back-off decision in the notes', () => {
		for (const backoff of [null, block(70, 6, 1), block(70, 8, 9)]) {
			const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 82.5, backoff }), OHP);
			expect(plan.notes).toContain(plan.backoff.reason);
		}
	});
});
