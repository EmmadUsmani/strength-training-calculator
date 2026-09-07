import { describe, expect, it } from 'vitest';
import {
	floorToIncrement,
	formatDelta,
	formatNumber,
	formatWeight,
	percentOf,
	roundToIncrement
} from './rounding';

describe('roundToIncrement', () => {
	it('rounds to the nearest 2.5 lb', () => {
		expect(roundToIncrement(86.625, 2.5)).toBe(87.5);
		expect(roundToIncrement(84, 2.5)).toBe(85);
		expect(roundToIncrement(69.7, 2.5)).toBe(70);
		expect(roundToIncrement(49.3, 2.5)).toBe(50);
	});

	it('rounds halfway values up', () => {
		expect(roundToIncrement(81.25, 2.5)).toBe(82.5);
	});

	it('leaves exact multiples untouched', () => {
		expect(roundToIncrement(82.5, 2.5)).toBe(82.5);
		expect(roundToIncrement(105, 2.5)).toBe(105);
	});

	it('avoids floating point noise', () => {
		expect(roundToIncrement(97.5, 2.5)).toBe(97.5);
		expect(roundToIncrement(0.1 + 0.2, 2.5)).toBe(0);
	});

	it('supports other increments', () => {
		expect(roundToIncrement(94.5, 5)).toBe(95);
		expect(roundToIncrement(86.3, 1.25)).toBe(86.25);
	});

	it('rejects a non-positive increment', () => {
		expect(() => roundToIncrement(100, 0)).toThrow();
	});
});

describe('floorToIncrement', () => {
	it('never rounds up', () => {
		expect(floorToIncrement(94.5, 2.5)).toBe(92.5);
		expect(floorToIncrement(95, 2.5)).toBe(95);
	});

	it('is stable on exact multiples despite float division', () => {
		expect(floorToIncrement(82.5, 2.5)).toBe(82.5);
		expect(floorToIncrement(107.5, 2.5)).toBe(107.5);
	});
});

describe('formatting', () => {
	it('drops trailing zeros', () => {
		expect(formatNumber(105)).toBe('105');
		expect(formatNumber(82.5)).toBe('82.5');
	});

	it('labels weights in pounds', () => {
		expect(formatWeight(82.5)).toBe('82.5 lb');
	});

	it('signs deltas', () => {
		expect(formatDelta(2.5)).toBe('+2.5');
		expect(formatDelta(-10.5)).toBe('-10.5');
		expect(formatDelta(0)).toBe('0');
	});
});

describe('percentOf', () => {
	it('reports whole percentages of the top set', () => {
		expect(percentOf(70, 85)).toBe(82);
		expect(percentOf(85, 105)).toBe(81);
	});

	it('handles a zero top set without dividing by zero', () => {
		expect(percentOf(50, 0)).toBe(0);
	});
});
