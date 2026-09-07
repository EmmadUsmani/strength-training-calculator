import { describe, expect, it } from 'vitest';
import {
	dateOfSession,
	daysAfterLastSession,
	daysBetweenSessions,
	formatSessionDate,
	fromDateInputValue,
	toDateInputValue,
	today,
	weekOf
} from './schedule';

const MONDAY = new Date(2026, 8, 7); // 7 Sep 2026

describe('daysBetweenSessions', () => {
	it('spaces sessions evenly across the week', () => {
		expect(daysBetweenSessions(2)).toBe(3.5);
		expect(daysBetweenSessions(1)).toBe(7);
		expect(daysBetweenSessions(1.5)).toBeCloseTo(4.667, 3);
	});

	it('falls back to weekly on nonsense input', () => {
		expect(daysBetweenSessions(0)).toBe(7);
		expect(daysBetweenSessions(-1)).toBe(7);
		expect(daysBetweenSessions(Number.NaN)).toBe(7);
	});
});

describe('daysAfterLastSession', () => {
	it('accumulates whole days at two sessions a week', () => {
		expect([1, 2, 3, 4].map((n) => daysAfterLastSession(n, 2))).toEqual([4, 7, 11, 14]);
	});

	it('handles a fractional frequency', () => {
		expect([1, 2, 3].map((n) => daysAfterLastSession(n, 1.5))).toEqual([5, 9, 14]);
	});
});

describe('weekOf', () => {
	it('counts the first seven days as week 1', () => {
		expect([1, 2, 3, 4, 5, 6].map((n) => weekOf(n, 2))).toEqual([1, 1, 2, 2, 3, 3]);
	});

	it('stretches the weeks out at a lower frequency', () => {
		expect([1, 2, 3, 4].map((n) => weekOf(n, 1))).toEqual([1, 2, 3, 4]);
	});

	it('never returns week zero', () => {
		expect(weekOf(1, 7)).toBe(1);
	});
});

describe('dateOfSession', () => {
	it('walks forward from the last session', () => {
		expect(dateOfSession(1, 2, MONDAY).getDate()).toBe(11);
		expect(dateOfSession(2, 2, MONDAY).getDate()).toBe(14);
	});

	it('rolls over month boundaries', () => {
		const date = dateOfSession(8, 2, new Date(2026, 8, 25));
		expect(date.getMonth()).toBe(9);
		expect(date.getDate()).toBe(23);
	});

	it('does not mutate the date it is given', () => {
		const start = new Date(MONDAY.getTime());
		dateOfSession(4, 2, start);
		expect(start.getTime()).toBe(MONDAY.getTime());
	});
});

describe('date input round-tripping', () => {
	it('formats a local date without drifting time zone', () => {
		expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(toDateInputValue(new Date(2026, 11, 31))).toBe('2026-12-31');
	});

	it('parses back to the same local date', () => {
		const parsed = fromDateInputValue('2026-09-07');
		expect(parsed?.getFullYear()).toBe(2026);
		expect(parsed?.getMonth()).toBe(8);
		expect(parsed?.getDate()).toBe(7);
	});

	it('rejects anything that is not an ISO calendar date', () => {
		expect(fromDateInputValue('')).toBeNull();
		expect(fromDateInputValue('07/09/2026')).toBeNull();
		expect(fromDateInputValue('2026-9-7')).toBeNull();
	});
});

describe('misc', () => {
	it('zeroes the time on today', () => {
		const now = today();
		expect([now.getHours(), now.getMinutes(), now.getSeconds()]).toEqual([0, 0, 0]);
	});

	it('formats a date short enough for a table cell', () => {
		expect(formatSessionDate(MONDAY)).toMatch(/Sep/);
	});
});
