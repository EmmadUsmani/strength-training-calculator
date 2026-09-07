import { describe, expect, it } from 'vitest';
import { PlannerState } from './planner.svelte';

function withBench(weight: number | null) {
	const planner = new PlannerState();
	planner.selectLift('bench');
	planner.entry.lastTopSetWeight = weight;
	return planner;
}

describe('PlannerState', () => {
	it('starts on bench with nothing filled in', () => {
		const planner = new PlannerState();
		expect(planner.selectedLiftId).toBe('bench');
		expect(planner.hasInput).toBe(false);
		expect(planner.hasBackoffBlock).toBe(false);
		expect(planner.plan).toBeNull();
		expect(planner.projection).toEqual([]);
		expect(planner.filledLiftIds).toEqual([]);
	});

	it('treats a blank or non-positive weight as no input', () => {
		expect(withBench(null).hasInput).toBe(false);
		expect(withBench(0).hasInput).toBe(false);
		expect(withBench(Number.NaN).hasInput).toBe(false);
		expect(withBench(105).hasInput).toBe(true);
	});

	it('builds a plan once a weight is entered', () => {
		const planner = withBench(105);
		expect(planner.plan?.topSet.weight).toBe(107.5);
		expect(planner.projection).toHaveLength(planner.sessionCount);
	});

	it('derives the outcome from the reps rather than a separate control', () => {
		const planner = withBench(105);

		planner.entry.lastTopSetReps = 5;
		expect(planner.plan?.topSet.outcome).toBe('clean');

		planner.entry.lastTopSetReps = 3;
		expect(planner.plan?.topSet.outcome).toBe('miss');
	});

	it('only honours the grind flag when the reps were hit', () => {
		const planner = withBench(105);
		planner.entry.grindy = true;

		planner.entry.lastTopSetReps = 5;
		expect(planner.input?.grindy).toBe(true);
		expect(planner.plan?.topSet.action).toBe('hold');

		planner.entry.lastTopSetReps = 3;
		expect(planner.input?.grindy).toBe(false);
	});

	it('only honours the miss streak when the last session missed', () => {
		const planner = withBench(105);
		planner.entry.previousSessionMissed = true;

		planner.entry.lastTopSetReps = 5;
		expect(planner.input?.previousSessionMissed).toBe(false);
		expect(planner.plan?.topSet.action).toBe('advance-load');

		planner.entry.lastTopSetReps = 3;
		expect(planner.input?.previousSessionMissed).toBe(true);
		expect(planner.plan?.topSet.action).toBe('deload');
	});

	it('leaves the back-off block null until a weight is entered', () => {
		const planner = withBench(105);
		expect(planner.input?.backoff).toBeNull();
		expect(planner.plan?.backoff.trigger).toBe('no-history');

		planner.entry.backoffWeight = 90;
		expect(planner.hasBackoffBlock).toBe(true);
		expect(planner.input?.backoff).toEqual({ weight: 90, reps: 6, sessionsUsed: 1 });
	});

	it('passes the back-off mode override through to the plan', () => {
		const planner = withBench(105);
		planner.entry.backoffWeight = 90;
		planner.entry.backoffSessions = 1;

		expect(planner.plan?.backoff.recalculate).toBe(false);
		planner.entry.backoffMode = 'recalculate';
		expect(planner.plan?.backoff.recalculate).toBe(true);
		expect(planner.plan?.backoff.trigger).toBe('manual');
	});

	it('feeds the training frequency into the back-off session limit', () => {
		const planner = withBench(105);
		planner.entry.backoffWeight = 90;
		planner.sessionsPerWeek = 2;
		expect(planner.plan?.backoff.sessionLimit).toBe(6);
		planner.sessionsPerWeek = 1;
		expect(planner.plan?.backoff.sessionLimit).toBe(3);
	});

	it('dates the projection from the last session', () => {
		const planner = withBench(105);
		planner.lastSessionDate = new Date(2026, 8, 7);
		planner.sessionsPerWeek = 2;
		expect(planner.projection[0].date?.getDate()).toBe(11);
	});

	it('floors the back-off session count at one', () => {
		const planner = withBench(105);
		planner.entry.backoffWeight = 90;
		planner.entry.backoffSessions = 0;
		expect(planner.input?.backoff?.sessionsUsed).toBe(1);
	});

	it('keeps a separate entry per lift', () => {
		const planner = withBench(105);
		planner.selectLift('ohp');
		expect(planner.hasInput).toBe(false);
		planner.entry.lastTopSetWeight = 82.5;

		expect(planner.filledLiftIds).toEqual(['bench', 'ohp']);
		expect(planner.plan?.topSet.weight).toBe(85);
		planner.selectLift('bench');
		expect(planner.plan?.topSet.weight).toBe(107.5);
	});

	it('seeds each lift with its own rep defaults', () => {
		const planner = new PlannerState();
		planner.selectLift('curl');
		expect(planner.entry.lastTopSetReps).toBe(8);
		expect(planner.entry.backoffReps).toBe(8);
		planner.selectLift('bench');
		expect(planner.entry.lastTopSetReps).toBe(5);
		expect(planner.entry.backoffReps).toBe(6);
	});

	it('passes the extended warm-up flag through to the plan', () => {
		const planner = withBench(105);
		const normal = planner.plan?.sets.filter((set) => set.kind === 'warmup').length ?? 0;
		planner.forceExtendedWarmup = true;
		expect(planner.plan?.sets.filter((set) => set.kind === 'warmup')).toHaveLength(normal + 1);
	});

	it('clears every entry on reset', () => {
		const planner = withBench(105);
		planner.entry.backoffWeight = 90;
		planner.forceExtendedWarmup = true;
		planner.reset();
		expect(planner.filledLiftIds).toEqual([]);
		expect(planner.hasBackoffBlock).toBe(false);
		expect(planner.forceExtendedWarmup).toBe(false);
	});

	it('is a pure function of its inputs — two instances agree', () => {
		const a = withBench(105);
		const b = withBench(105);
		a.entry.backoffWeight = 90;
		b.entry.backoffWeight = 90;
		expect(a.plan?.sets).toEqual(b.plan?.sets);
	});
});
