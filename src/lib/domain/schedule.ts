/** Turning a training frequency into calendar weeks and dates. */

export const DEFAULT_SESSIONS_PER_WEEK = 2;

/** Days between consecutive sessions of one lift. */
export function daysBetweenSessions(sessionsPerWeek: number): number {
	if (!Number.isFinite(sessionsPerWeek) || sessionsPerWeek <= 0) return 7;
	return 7 / sessionsPerWeek;
}

/** Whole days from the last session to session `n` (1-based). */
export function daysAfterLastSession(session: number, sessionsPerWeek: number): number {
	return Math.round(session * daysBetweenSessions(sessionsPerWeek));
}

/**
 * Calendar week the session falls in, counting from the last session:
 * anything inside the first seven days is week 1.
 */
export function weekOf(session: number, sessionsPerWeek: number): number {
	const days = daysAfterLastSession(session, sessionsPerWeek);
	return Math.max(1, Math.ceil(days / 7));
}

/** The date of session `n`, given when the last one happened. */
export function dateOfSession(
	session: number,
	sessionsPerWeek: number,
	lastSessionDate: Date
): Date {
	const date = new Date(lastSessionDate.getTime());
	date.setDate(date.getDate() + daysAfterLastSession(session, sessionsPerWeek));
	return date;
}

/** "Mon 14 Sep" — short enough for a table cell, unambiguous about the day. */
export function formatSessionDate(date: Date): string {
	return date.toLocaleDateString(undefined, {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});
}

/** Today, with the time zeroed so date maths stays stable. */
export function today(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** `<input type="date">` wants an ISO calendar date in local time. */
export function toDateInputValue(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** Parse an `<input type="date">` value as a local date, or null if unusable. */
export function fromDateInputValue(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const [, year, month, day] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	return Number.isNaN(date.getTime()) ? null : date;
}
