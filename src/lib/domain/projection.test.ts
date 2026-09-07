import { describe, expect, it } from 'vitest';
import { BENCH, CURL, OHP } from './lifts';
import { projectSessions } from './projection';
import type { LiftInput } from './types';

const afterClean = (weight: number, reps?: number): LiftInput => ({
	lastTopSetWeight: weight,
	outcome: 'clean',
	previousSessionMissed: false,
	lastTopSetReps: reps
});

describe('projectSessions', () => {
	it('returns the requested number of sessions, numbered from 1', () => {
		const sessions = projectSessions(afterClean(82.5), OHP, 6);
		expect(sessions).toHaveLength(6);
		expect(sessions.map((session) => session.session)).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('starts from the same prescription the calculator gives', () => {
		const [first] = projectSessions(afterClean(82.5), OHP, 4);
		expect(first.topSet.weight).toBe(85);
	});

	it('adds 2.5 lb per session on the all-clean path', () => {
		const weights = projectSessions(afterClean(82.5), OHP, 5).map((s) => s.topSet.weight);
		expect(weights).toEqual([85, 87.5, 90, 92.5, 95]);
	});

	it('advances every other session when clean sessions alternate with grinds', () => {
		const weights = projectSessions(afterClean(100), BENCH, 6, 'alternating').map(
			(s) => s.topSet.weight
		);
		expect(weights).toEqual([102.5, 105, 105, 107.5, 107.5, 110]);
	});

	it('cycles hold then deload when every session stalls', () => {
		const sessions = projectSessions(
			{ lastTopSetWeight: 105, outcome: 'miss', previousSessionMissed: false },
			BENCH,
			5,
			'stall'
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

	it('recomputes back-off weights alongside the top set', () => {
		const [first, second] = projectSessions(afterClean(82.5), OHP, 2);
		expect(first.backoffWeights).toEqual([70, 70, 67.5]);
		expect(second.backoffWeights).toEqual([72.5, 72.5, 70]);
	});

	it('walks the curl rep ladder before adding weight', () => {
		const sessions = projectSessions(afterClean(50, 8), CURL, 6);
		expect(sessions.map((s) => s.topSet.targetReps)).toEqual([9, 10, 11, 12, 8, 9]);
		expect(sessions.map((s) => s.topSet.weight)).toEqual([50, 50, 50, 50, 52.5, 52.5]);
	});

	it('records the outcome each row assumes', () => {
		const sessions = projectSessions(afterClean(100), BENCH, 4, 'alternating');
		expect(sessions.map((s) => s.assumedOutcome)).toEqual(['clean', 'grind', 'clean', 'grind']);
	});

	it('returns nothing for a zero-length projection', () => {
		expect(projectSessions(afterClean(100), BENCH, 0)).toEqual([]);
	});
});
