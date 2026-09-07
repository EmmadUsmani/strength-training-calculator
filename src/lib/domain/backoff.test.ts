import { describe, expect, it } from 'vitest';
import { BENCH, CURL, DEADLIFT, OHP, ROW, SQUAT } from './lifts';
import {
	RECALC_MOVEMENT_LB,
	RECALC_WEEKS,
	buildAccessory,
	buildBackoffs,
	buildFinisher,
	decideBackoff,
	impliedAnchor,
	nextBackoffReps,
	recalcSessionLimit
} from './backoff';
import { nextTopSet } from './progression';
import { makeInput } from './testing';
import type { BackoffInput, BackoffMode, LiftConfig, TopSetPrescription } from './types';

function topSetOf(weight: number, lift: LiftConfig = OHP): TopSetPrescription {
	// A clean session at `weight - increment` prescribes exactly `weight`.
	return nextTopSet(makeInput({ lastTopSetWeight: weight - lift.increment }), lift);
}

function block(weight: number, reps = 6, sessionsUsed = 1): BackoffInput {
	return { weight, reps, sessionsUsed };
}

function decide(
	topSetWeight: number,
	backoff: BackoffInput | null,
	options: { lift?: LiftConfig; mode?: BackoffMode; sessionsPerWeek?: number } = {}
) {
	const lift = options.lift ?? OHP;
	return decideBackoff(topSetOf(topSetWeight, lift), lift, backoff, {
		mode: options.mode ?? 'auto',
		sessionsPerWeek: options.sessionsPerWeek ?? 2
	});
}

describe('recalcSessionLimit', () => {
	it('turns the 3-week fallback into a session count', () => {
		expect(recalcSessionLimit(2)).toBe(RECALC_WEEKS * 2);
		expect(recalcSessionLimit(1.5)).toBe(5);
		expect(recalcSessionLimit(1)).toBe(3);
	});

	it('never drops below two sessions', () => {
		expect(recalcSessionLimit(0.25)).toBe(2);
	});

	it('falls back to a sane default on nonsense input', () => {
		expect(recalcSessionLimit(0)).toBe(6);
		expect(recalcSessionLimit(Number.NaN)).toBe(6);
	});
});

describe('impliedAnchor', () => {
	it('recovers a loadable top set, not a fraction', () => {
		// A 70 lb OHP back-off comes from an 82.5 or 85 lb top set.
		expect(impliedAnchor(70, OHP)).toBe(85);
		// A 72.5 lb bench back-off can only have come from 87.5 lb.
		expect(impliedAnchor(72.5, BENCH)).toBe(87.5);
	});

	it('uses each lift own primary percentage', () => {
		// Deadlift anchors at 80%, not 85%.
		expect(impliedAnchor(120, DEADLIFT)).toBe(152.5);
		expect(impliedAnchor(85, BENCH)).toBe(102.5);
	});

	it('corrects for the downward rounding rather than reading light', () => {
		// The naive inverse, 70 / 0.85, is 82.35 — below every top set that could
		// have produced it, which would fire the movement trigger a session early.
		expect(impliedAnchor(70, OHP)).toBeGreaterThan((70 * 100) / 85);
	});
});

describe('decideBackoff', () => {
	it('calculates a fresh block when nothing is logged', () => {
		const decision = decide(85, null);
		expect(decision.recalculate).toBe(true);
		expect(decision.trigger).toBe('no-history');
		expect(decision.anchor).toBeNull();
	});

	it('holds the block while the top set is still close to the anchor', () => {
		const decision = decide(85, block(70));
		expect(decision.recalculate).toBe(false);
		expect(decision.trigger).toBeNull();
		expect(decision.movement).toBe(0);
		expect(decision.reason).toContain('Holding the block');
	});

	it('resets once the top set has moved past the movement threshold', () => {
		const decision = decide(92.5, block(70));
		expect(decision.movement).toBeGreaterThanOrEqual(RECALC_MOVEMENT_LB);
		expect(decision.recalculate).toBe(true);
		expect(decision.trigger).toBe('movement');
	});

	it('holds until the top set has climbed a full 7.5 lb past the anchor', () => {
		// 2.5 lb a session from the 85 lb anchor a 70 lb back-off implies.
		expect([85, 87.5, 90].map((top) => decide(top, block(70)).recalculate)).toEqual([
			false,
			false,
			false
		]);
		expect(decide(92.5, block(70)).recalculate).toBe(true);
	});

	it('resets on the time fallback even when the top set has barely moved', () => {
		const decision = decide(85, block(70, 8, 6));
		expect(decision.recalculate).toBe(true);
		expect(decision.trigger).toBe('sessions');
		expect(decision.sessionLimit).toBe(6);
	});

	it('scales the time fallback to how often you train the lift', () => {
		expect(decide(85, block(70, 8, 4), { sessionsPerWeek: 1 }).trigger).toBe('sessions');
		expect(decide(85, block(70, 8, 4), { sessionsPerWeek: 3 }).recalculate).toBe(false);
	});

	it('resets the block when the top set deloads', () => {
		const lift = BENCH;
		const topSet = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3, previousSessionMissed: true }),
			lift
		);
		const decision = decideBackoff(topSet, lift, block(90, 6, 1), {
			mode: 'auto',
			sessionsPerWeek: 2
		});
		expect(topSet.action).toBe('deload');
		expect(decision.recalculate).toBe(true);
		expect(decision.trigger).toBe('deload');
	});

	it('lets a manual hold override every automatic trigger', () => {
		const decision = decide(120, block(70, 8, 20), { mode: 'hold' });
		expect(decision.recalculate).toBe(false);
		expect(decision.trigger).toBe('manual');
	});

	it('lets a manual reset override a block that would otherwise hold', () => {
		const decision = decide(85, block(70, 6, 1), { mode: 'recalculate' });
		expect(decision.recalculate).toBe(true);
		expect(decision.trigger).toBe('manual');
	});

	it('counts down to whichever trigger comes first', () => {
		const decision = decide(85, block(70, 6, 2));
		expect(decision.reason).toContain('another');
		expect(decision.reason).toContain('4 more sessions');
	});

	it('scales the movement threshold check off the lift increment', () => {
		// A 2.5 lb increment means the movement trigger is three clean sessions.
		expect(RECALC_MOVEMENT_LB / OHP.increment).toBe(3);
	});
});

describe('buildBackoffs — freshly recalculated block', () => {
	it('derives the presses from the day’s top set at the bottom of the rep range', () => {
		const sets = buildBackoffs(85, OHP, decide(85, null), null);
		expect(sets.map((set) => set.weight)).toEqual([70, 70, 67.5]);
		expect(sets.every((set) => set.reps === '6-8')).toBe(true);
	});

	it('matches the worked bench example from the research', () => {
		expect(
			buildBackoffs(105, BENCH, decide(105, null, { lift: BENCH }), null).map((set) => set.weight)
		).toEqual([87.5, 87.5, 85]);
	});

	it('never prescribes a back-off above 85% of the top set', () => {
		for (const lift of [BENCH, OHP, ROW, SQUAT, DEADLIFT]) {
			for (const top of [25, 40, 65, 85, 100, 105, 130, 160, 315]) {
				const decision = decide(top, null, { lift });
				for (const set of buildBackoffs(top, lift, decision, null)) {
					expect((set.weight as number) / top).toBeLessThanOrEqual(0.85 + 1e-9);
				}
			}
		}
	});

	it('gives squat a single back-off and deadlift a lighter optional one', () => {
		const squat = buildBackoffs(155, SQUAT, decide(155, null, { lift: SQUAT }), null);
		expect(squat).toHaveLength(1);
		expect(squat[0].weight).toBe(130);
		expect(squat[0].label).toBe('Back-off');
		expect(squat[0].optional).toBeFalsy();

		const deadlift = buildBackoffs(165, DEADLIFT, decide(165, null, { lift: DEADLIFT }), null);
		expect(deadlift).toHaveLength(1);
		expect(deadlift[0].weight).toBe(132.5);
		expect(deadlift[0].optional).toBe(true);
	});

	it('numbers the sets only when there is more than one', () => {
		expect(buildBackoffs(85, OHP, decide(85, null), null).map((set) => set.label)).toEqual([
			'Back-off 1',
			'Back-off 2',
			'Back-off 3'
		]);
	});
});

describe('buildBackoffs — held block', () => {
	it('keeps the weight you logged and chases one more rep', () => {
		const held = block(70, 6);
		const decision = decide(85, held);
		expect(decision.recalculate).toBe(false);
		const sets = buildBackoffs(85, OHP, decision, held);
		expect(sets.map((set) => set.weight)).toEqual([70, 67.5, 65]);
		expect(sets.map((set) => set.reps)).toEqual(['7', '7', '7']);
	});

	it('stops adding reps at the top of the range', () => {
		const held = block(70, 8);
		const sets = buildBackoffs(85, OHP, decide(85, held), held);
		expect(sets.map((set) => set.reps)).toEqual(['8', '8', '8']);
	});

	it('preserves the shape of the block across its lighter sets', () => {
		const held = block(90, 6);
		const decision = decide(107.5, held, { lift: BENCH, mode: 'hold' });
		const sets = buildBackoffs(107.5, BENCH, decision, held);
		// 85 / 82.5 / 80 percent, expressed relative to the logged 90 lb set.
		expect(sets.map((set) => set.weight)).toEqual([90, 87.5, 85]);
	});

	it('still caps a held block at 85% if the top set drops beneath it', () => {
		const held = block(90, 6);
		const decision = decide(95, held, { lift: BENCH, mode: 'hold' });
		for (const set of buildBackoffs(95, BENCH, decision, held)) {
			expect((set.weight as number) / 95).toBeLessThanOrEqual(0.85 + 1e-9);
		}
	});

	it('resets the reps to the bottom of the range when the block recalculates', () => {
		const held = block(70, 8, 6);
		const decision = decide(85, held);
		expect(decision.recalculate).toBe(true);
		expect(buildBackoffs(85, OHP, decision, held)[0].reps).toBe('6-8');
	});
});

describe('nextBackoffReps', () => {
	it('adds one rep per session inside the range', () => {
		expect(nextBackoffReps(6, { minReps: 6, maxReps: 8 })).toBe(7);
		expect(nextBackoffReps(7, { minReps: 6, maxReps: 8 })).toBe(8);
	});

	it('clamps to the range at both ends', () => {
		expect(nextBackoffReps(8, { minReps: 6, maxReps: 8 })).toBe(8);
		expect(nextBackoffReps(2, { minReps: 6, maxReps: 8 })).toBe(6);
	});

	it('falls back to the bottom of the range on nonsense input', () => {
		expect(nextBackoffReps(Number.NaN, { minReps: 6, maxReps: 8 })).toBe(6);
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

	it('keeps the drop set at or below 60% of the top set', () => {
		for (const top of [40, 85, 105, 130]) {
			const [set] = buildFinisher(top, BENCH);
			expect((set.weight as number) / top).toBeLessThanOrEqual(0.6 + 1e-9);
		}
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
