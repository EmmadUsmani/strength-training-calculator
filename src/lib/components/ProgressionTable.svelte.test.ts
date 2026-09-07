import { cleanup, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressionTable from './ProgressionTable.svelte';
import { BENCH, OHP } from '$lib/domain/lifts';
import { projectSessions } from '$lib/domain/projection';
import { makeInput } from '$lib/domain/testing';

describe('ProgressionTable', () => {
	it('labels the first row "Next" and the rest by offset', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 82.5 }),
			OHP,
			3
		);
		render(ProgressionTable, { sessions, lift: OHP });
		const rows = within(screen.getByRole('table')).getAllByRole('row');
		expect(rows[1]).toHaveTextContent('Next');
		expect(rows[2]).toHaveTextContent('+1');
		expect(rows[3]).toHaveTextContent('+2');
	});

	it('renders a column per back-off set', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 82.5 }),
			OHP,
			2
		);
		render(ProgressionTable, { sessions, lift: OHP });
		expect(screen.getByRole('columnheader', { name: 'Back-off 1' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Back-off 3' })).toBeInTheDocument();
	});

	it('summarises the total gain across the projection', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 82.5 }),
			OHP,
			5
		);
		render(ProgressionTable, { sessions, lift: OHP });
		expect(screen.getByText(/85 lb to 95 lb/)).toBeInTheDocument();
		expect(screen.getByText(/a gain of 10 lb/)).toBeInTheDocument();
	});

	it('flags the deload sessions in a stalled projection', () => {
		const sessions = projectSessions(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3 }),
			BENCH,
			4,
			{ scenario: 'stall' }
		);
		render(ProgressionTable, { sessions, lift: BENCH });
		expect(screen.getAllByText('deload')).toHaveLength(2);
		expect(screen.getAllByText('repeat')).toHaveLength(2);
	});
});

describe('ProgressionTable — schedule and blocks', () => {
	const withDates = () =>
		projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 4, {
			lastSessionDate: new Date(2026, 8, 7)
		});

	it('shows a week for every row', () => {
		render(ProgressionTable, { sessions: withDates(), lift: OHP });
		expect(screen.getByRole('columnheader', { name: 'Week' })).toBeInTheDocument();
	});

	it('shows a date column only when dates are available', () => {
		render(ProgressionTable, { sessions: withDates(), lift: OHP });
		expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();

		cleanup();
		render(ProgressionTable, {
			sessions: projectSessions(makeInput({ lastTopSetWeight: 82.5 }), OHP, 4),
			lift: OHP
		});
		expect(screen.queryByRole('columnheader', { name: 'Date' })).not.toBeInTheDocument();
	});

	it('counts the back-off resets in the summary', () => {
		const sessions = projectSessions(
			makeInput({
				lastTopSetWeight: 82.5,
				backoff: { weight: 70, reps: 6, sessionsUsed: 1 }
			}),
			OHP,
			8
		);
		render(ProgressionTable, { sessions, lift: OHP });
		expect(screen.getByText(/2 back-off resets/)).toBeInTheDocument();
	});
});
