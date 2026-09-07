/** Weight rounding helpers. All weights in the app are in pounds. */

/** Round `weight` to the nearest multiple of `increment`. */
export function roundToIncrement(weight: number, increment: number): number {
	if (increment <= 0) throw new Error('increment must be positive');
	// Work in increment-units to dodge binary floating point drift on .5 values.
	const units = Math.round(weight / increment);
	return round2(units * increment);
}

/** Round down to a multiple of `increment` (used where overshooting is unsafe). */
export function floorToIncrement(weight: number, increment: number): number {
	if (increment <= 0) throw new Error('increment must be positive');
	return round2(Math.floor(weight / increment + 1e-9) * increment);
}

/** Trim binary floating point noise from an lb value. */
export function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/** Format a weight for display: "82.5 lb", "105 lb". */
export function formatWeight(weight: number): string {
	return `${formatNumber(weight)} lb`;
}

/** Format a number without trailing ".0". */
export function formatNumber(value: number): string {
	return Number.isInteger(value) ? String(value) : String(round2(value));
}

/** Format a signed delta: "+2.5", "-10.5", "0". */
export function formatDelta(value: number): string {
	if (value === 0) return '0';
	return `${value > 0 ? '+' : ''}${formatNumber(round2(value))}`;
}

/** Percentage of `top`, rounded to a whole number. */
export function percentOf(weight: number, top: number): number {
	if (top === 0) return 0;
	return Math.round((weight * 100) / top);
}
