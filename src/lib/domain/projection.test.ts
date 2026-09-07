import { describe, expect, it } from 'vitest';
import { BENCH, CURL, OHP } from './lifts';
import { projectSessions } from './projection';
import { makeInput } from './testing';

const START = new Date(2026, 8, 7); // Mon 7 Sep 2026

describe('projectSessions', () => {
	it('returns the requested number of sessions, numbered from 1', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 6);
		expect(sessions).toHaveLength(6);
		expect(sessions.map((session) => session.session)).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('starts from the same prescription the calculator gives', () => {
		const [first] = projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 4);
		expect(first.topSet.weight).toBe(85);
	});

	it('adds 2.5 lb per session on the all-clean path', () => {
		const weights = projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 5).map(
			(s) => s.topSet.weight
		);
		expect(weights).toEqual([85, 87.5, 90, 92.5, 95]);
	});

	it('advances every other session when clean sessions alternate with grinds', () => {
		const weights = projectSessions(makeInput({ lastTopSetWeight: 100 }), BENCH, 6, {
			scenario: 'alternating'
		}).map((s) => s.topSet.weight);
		expect(weights).toEqual([102.5, 105, 105, 107.5, 107.5, 110]);
	});

	it('cycles hold then deload when every session stalls', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3 }),
			BENCH,
			5,
			{ scenario: 'stall' }
		);
		expect(sessions.map((s) => s.topSet.action)).toEqual([
			'hold',
			'deload',
			'hold',
			'deload',
			'hold'
		]);
		expect(sessions.map((s) => s.topSet.weight)).toEqual([105, 95, 95, 85, 85]);
	});

	it('records the outcome each row assumes', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 100 }), BENCH, 4, {
			scenario: 'alternating'
		});
		expect(sessions.map((s) => s.assumedOutcome)).toEqual(['clean', 'grind', 'clean', 'grind']);
	});

	it('returns nothing for a zero-length projection', () => {
		expect(projectSessions(makeInput(), BENCH, 0)).toEqual([]);
	});

	it('walks the curl rep ladder before adding weight', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 50, lastTopSetReps: 8 }),
			CURL,
			6
		);
		expect(sessions.map((s) => s.topSet.targetReps)).toEqual([9, 10, 11, 12, 8, 9]);
		expect(sessions.map((s) => s.topSet.weight)).toEqual([50, 50, 50, 50, 52.5, 52.5]);
	});
});

describe('projectSessions — back-off blocks', () => {
	const withBlock = (overrides = {}) =>
		makeInput({
			lastTopSetWeight: 82.5,
			backoff: { weight: 70, reps: 6, sessionsUsed: 1 },
			...overrides
		});

	it('holds a block for several sessions before resetting it', () => {
		const sessions = projectSessions(withBlock(), OHP, 8);
		// 7.5 lb of movement is three clean 2.5 lb sessions, so a perfectly clean
		// run resets every third or fourth session — the fast end of the 4-6 the
		// research expects once misses and repeats are in the mix.
		expect(sessions.map((s) => s.backoff.recalculate)).toEqual([
			false,
			false,
			false,
			true,
			false,
			false,
			true,
			false
		]);
	});

	it('holds the back-off weight steady across a block', () => {
		const sessions = projectSessions(withBlock(), OHP, 8);
		expect(sessions.map((s) => s.backoffWeights[0])).toEqual([
			70, 70, 70, 77.5, 77.5, 77.5, 85, 85
		]);
	});

	it('numbers the sessions within each block', () => {
		const sessions = projectSessions(withBlock(), OHP, 8);
		expect(sessions.map((s) => s.backoffSession)).toEqual([2, 3, 4, 1, 2, 3, 1, 2]);
	});

	it('only ever resets on a movement or time trigger', () => {
		for (const session of projectSessions(withBlock(), OHP, 12)) {
			if (session.backoff.recalculate) {
				expect(['movement', 'sessions']).toContain(session.backoff.trigger);
			}
		}
	});

	it('resets once and then settles when no block is logged', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 3);
		expect(sessions[0].backoff.trigger).toBe('no-history');
		expect(sessions.map((s) => s.backoff.recalculate)).toEqual([true, false, false]);
	});

	it('falls back to the time trigger when sessions are far apart', () => {
		// One session a week means the 3-week fallback fires after three sessions,
		// before the top set has moved far enough to trigger on its own.
		const sessions = projectSessions(withBlock({ sessionsPerWeek: 1 }), OHP, 4);
		expect(sessions.map((s) => s.backoff.trigger)).toEqual([null, null, 'sessions', null]);
		expect(sessions[2].backoffWeights[0]).toBe(75);
	});

	it('takes whichever trigger comes first', () => {
		const sessions = projectSessions(withBlock({ sessionsPerWeek: 1 }), OHP, 6);
		expect(sessions.map((s) => s.backoff.trigger)).toEqual([
			null,
			null,
			'sessions',
			null,
			null,
			'movement'
		]);
	});
});

describe('projectSessions — schedule', () => {
	it('numbers calendar weeks from the last session', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 100 }), BENCH, 6);
		expect(sessions.map((s) => s.week)).toEqual([1, 1, 2, 2, 3, 3]);
	});

	it('stretches the weeks out at a fractional frequency', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 100, sessionsPerWeek: 1.5 }),
			BENCH,
			4
		);
		expect(sessions.map((s) => s.week)).toEqual([1, 2, 2, 3]);
	});

	it('dates the sessions forward from the last one', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 100 }), BENCH, 3, {
			lastSessionDate: START
		});
		expect(sessions.map((s) => s.date?.getDate())).toEqual([11, 14, 18]);
	});

	it('leaves dates off when no last-session date is given', () => {
		const sessions = projectSessions(makeInput({ lastTopSetWeight: 100 }), BENCH, 3);
		expect(sessions.every((s) => s.date === null)).toBe(true);
	});
});
