import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, OHP, ROW, SQUAT } from './lifts';
import { buildAccessory, buildBackoffs, buildFinisher } from './backoff';

describe('buildBackoffs', () => {
	it('gives the presses three descending sets', () => {
		const sets = buildBackoffs(85, OHP);
		expect(sets.map((set) => set.weight)).toEqual([70, 70, 67.5]);
		expect(sets.every((set) => set.reps === '6-8')).toBe(true);
	});

	it('matches the worked bench example from the research', () => {
		expect(buildBackoffs(105, BENCH).map((set) => set.weight)).toEqual([87.5, 87.5, 85]);
	});

	it('never prescribes a back-off above 85% of the top set', () => {
		for (const lift of [BENCH, OHP, ROW, SQUAT, DEADLIFT]) {
			for (const top of [25, 40, 65, 85, 100, 105, 130, 160, 315]) {
				for (const set of buildBackoffs(top, lift)) {
					expect((set.weight as number) / top).toBeLessThanOrEqual(0.85 + 1e-9);
				}
			}
		}
	});

	it('stays near the band at realistic loads', () => {
		for (const top of [85, 100, 105, 130, 160]) {
			for (const set of buildBackoffs(top, BENCH)) {
				expect(set.percentOfTop).toBeGreaterThanOrEqual(78);
				expect(set.percentOfTop).toBeLessThanOrEqual(85);
			}
		}
	});

	it('gives squat a single 85% back-off and deadlift a lighter optional one', () => {
		const squat = buildBackoffs(155, SQUAT);
		expect(squat).toHaveLength(1);
		expect(squat[0].weight).toBe(130);
		expect(squat[0].label).toBe('Back-off');
		expect(squat[0].optional).toBeFalsy();

		const deadlift = buildBackoffs(165, DEADLIFT);
		expect(deadlift).toHaveLength(1);
		expect(deadlift[0].weight).toBe(132.5);
		expect(deadlift[0].optional).toBe(true);
	});

	it('gives row two back-offs', () => {
		expect(buildBackoffs(120, ROW).map((set) => set.weight)).toEqual([100, 95]);
	});

	it('keeps the drop set at or below 60% of the top set', () => {
		for (const top of [40, 85, 105, 130]) {
			const [set] = buildFinisher(top, BENCH);
			expect((set.weight as number) / top).toBeLessThanOrEqual(0.6 + 1e-9);
		}
	});

	it('numbers the sets only when there is more than one', () => {
		expect(buildBackoffs(85, OHP).map((set) => set.label)).toEqual([
			'Back-off 1',
			'Back-off 2',
			'Back-off 3'
		]);
	});

	it('never prescribes a back-off at or above the top set', () => {
		for (const top of [22.5, 25, 30, 40]) {
			for (const set of buildBackoffs(top, OHP)) {
				expect(set.weight).toBeLessThan(top);
				expect(set.weight).toBeGreaterThanOrEqual(OHP.barWeight);
			}
		}
	});
});

describe('buildFinisher', () => {
	it('prescribes one optional max-rep drop set at roughly 55%', () => {
		const sets = buildFinisher(105, BENCH);
		expect(sets).toHaveLength(1);
		expect(sets[0].weight).toBe(57.5);
		expect(sets[0].reps).toBe('max');
		expect(sets[0].optional).toBe(true);
	});

	it('is omitted for lifts without one', () => {
		expect(buildFinisher(155, SQUAT)).toEqual([]);
		expect(buildFinisher(165, DEADLIFT)).toEqual([]);
	});
});

describe('buildAccessory', () => {
	it('appends the dumbbell curl finisher with no prescribed load', () => {
		const sets = buildAccessory(CURL);
		expect(sets).toHaveLength(1);
		expect(sets[0].exercise).toBe('Dumbbell Curl');
		expect(sets[0].weight).toBeNull();
		expect(sets[0].rest).toBe('60-90 sec');
	});

	it('is omitted for lifts without one', () => {
		expect(buildAccessory(BENCH)).toEqual([]);
	});
});
