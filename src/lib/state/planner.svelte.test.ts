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

	it('only honours the miss streak when the last session was a miss', () => {
		const planner = withBench(105);
		planner.entry.previousSessionMissed = true;

		planner.entry.outcome = 'clean';
		expect(planner.input?.previousSessionMissed).toBe(false);
		expect(planner.plan?.topSet.action).toBe('advance-load');

		planner.entry.outcome = 'miss';
		expect(planner.input?.previousSessionMissed).toBe(true);
		expect(planner.plan?.topSet.action).toBe('deload');
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

	it('seeds the curl with its base rep target', () => {
		const planner = new PlannerState();
		planner.selectLift('curl');
		expect(planner.entry.lastTopSetReps).toBe(8);
	});

	it('passes the extended warm-up flag through to the plan', () => {
		const planner = withBench(105);
		const normal = planner.plan?.sets.filter((set) => set.kind === 'warmup').length ?? 0;
		planner.forceExtendedWarmup = true;
		expect(planner.plan?.sets.filter((set) => set.kind === 'warmup')).toHaveLength(normal + 1);
	});

	it('clears every entry on reset', () => {
		const planner = withBench(105);
		planner.forceExtendedWarmup = true;
		planner.reset();
		expect(planner.filledLiftIds).toEqual([]);
		expect(planner.forceExtendedWarmup).toBe(false);
	});
});
