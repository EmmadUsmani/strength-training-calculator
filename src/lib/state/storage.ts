import type { PlannerSnapshot } from './snapshot';
import { parseSnapshot } from './snapshot';

/**
 * Where the form snapshot lives. Versioned in the key itself, so a future
 * change to the snapshot shape simply ignores the old value rather than trying
 * to migrate something it does not understand.
 */
const STORAGE_KEY = 'top-set:inputs:v1';

/**
 * Persistence for what the user has typed — a typing convenience and nothing
 * more.
 *
 * The calculator never reads storage to decide anything: a snapshot only ever
 * flows back into the form fields, and every prescription is computed from the
 * form as it stands. If storage is empty, corrupt, or unavailable, the app
 * behaves exactly as it would with an untouched form.
 */

/** Whether this environment has a usable `localStorage`. */
function store(): Storage | null {
	try {
		// Absent during SSR and prerendering; can also throw outright when a
		// browser is configured to block site data.
		if (typeof localStorage === 'undefined') return null;
		return localStorage;
	} catch {
		return null;
	}
}

/** Read the saved form, or null if there is nothing usable to restore. */
export function loadSnapshot(fallback: PlannerSnapshot): PlannerSnapshot | null {
	const storage = store();
	if (!storage) return null;

	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return parseSnapshot(JSON.parse(raw), fallback);
	} catch {
		// Malformed JSON, a quota error on read, or blocked site data. Falling
		// back to an empty form is always safe, since nothing here is load-bearing.
		return null;
	}
}

/** Replace the saved form. Never appends — there is no history to accumulate. */
export function saveSnapshot(snapshot: PlannerSnapshot): void {
	const storage = store();
	if (!storage) return;

	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
	} catch {
		// Private browsing and full quotas both land here. Losing the convenience
		// of a saved form is not worth failing the page over.
	}
}

/** Forget the saved form. */
export function clearSnapshot(): void {
	const storage = store();
	if (!storage) return;

	try {
		storage.removeItem(STORAGE_KEY);
	} catch {
		// As above — best effort.
	}
}

/** Exported for tests, so they assert against the real key. */
export const STORAGE_KEY_FOR_TESTS = STORAGE_KEY;
