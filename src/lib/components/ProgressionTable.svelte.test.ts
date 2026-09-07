import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressionTable from './ProgressionTable.svelte';
import { BENCH, OHP } from '$lib/domain/lifts';
import { projectSessions } from '$lib/domain/projection';

describe('ProgressionTable', () => {
	it('labels the first row "Next" and the rest by offset', () => {
		const sessions = projectSessions(
			{ lastTopSetWeight: 82.5, outcome: 'clean', previousSessionMissed: false },
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
			{ lastTopSetWeight: 82.5, outcome: 'clean', previousSessionMissed: false },
			OHP,
			2
		);
		render(ProgressionTable, { sessions, lift: OHP });
		expect(screen.getByRole('columnheader', { name: 'Back-off 1' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Back-off 3' })).toBeInTheDocument();
	});

	it('summarises the total gain across the projection', () => {
		const sessions = projectSessions(
			{ lastTopSetWeight: 82.5, outcome: 'clean', previousSessionMissed: false },
			OHP,
			5
		);
		render(ProgressionTable, { sessions, lift: OHP });
		expect(screen.getByText(/85 lb to 95 lb/)).toBeInTheDocument();
		expect(screen.getByText(/a gain of 10 lb/)).toBeInTheDocument();
	});

	it('flags the deload sessions in a stalled projection', () => {
		const sessions = projectSessions(
			{ lastTopSetWeight: 105, outcome: 'miss', previousSessionMissed: false },
			BENCH,
			4,
			'stall'
		);
		render(ProgressionTable, { sessions, lift: BENCH });
		expect(screen.getAllByText('deload')).toHaveLength(2);
		expect(screen.getAllByText('repeat')).toHaveLength(2);
	});
});
