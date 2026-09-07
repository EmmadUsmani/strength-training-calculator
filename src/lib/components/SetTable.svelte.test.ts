import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SetTable from './SetTable.svelte';
import { buildWorkoutPlan } from '$lib/domain/plan';
import { makeInput } from '$lib/domain/testing';
import { CURL, DEADLIFT, OHP } from '$lib/domain/lifts';

const ohpPlan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 82.5, lastTopSetReps: 5 }), OHP);

describe('SetTable', () => {
	it('renders one row per prescribed set', () => {
		render(SetTable, { sets: ohpPlan.sets, lift: OHP });
		const rows = within(screen.getByRole('table')).getAllByRole('row');
		// One header row plus one per set.
		expect(rows).toHaveLength(ohpPlan.sets.length + 1);
	});

	it('shows the top set weight and reps', () => {
		render(SetTable, { sets: ohpPlan.sets, lift: OHP });
		const row = screen.getByRole('row', { name: /Top set/ });
		expect(within(row).getByText('85 lb')).toBeInTheDocument();
		expect(within(row).getByText('5')).toBeInTheDocument();
	});

	it('lists the warm-up ramp in ascending order', () => {
		render(SetTable, { sets: ohpPlan.sets, lift: OHP });
		expect(screen.getByRole('row', { name: /Warm-up 1/ })).toHaveTextContent('20 lb');
		expect(screen.getByRole('row', { name: /Warm-up 3/ })).toHaveTextContent('70 lb');
	});

	it('marks optional sets', () => {
		const plan = buildWorkoutPlan(makeInput({ lastTopSetWeight: 160 }), DEADLIFT);
		render(SetTable, { sets: plan.sets, lift: DEADLIFT });
		expect(screen.getByRole('row', { name: /Back-off/ })).toHaveTextContent('optional');
	});

	it('leaves the accessory finisher weight to the lifter', () => {
		const plan = buildWorkoutPlan(
			makeInput({ lastTopSetWeight: 50, lastTopSetReps: 8 }),
			CURL
		);
		render(SetTable, { sets: plan.sets, lift: CURL });
		const row = screen.getByRole('row', { name: /Dumbbell Curl/ });
		expect(within(row).getByText('your call')).toBeInTheDocument();
	});
});
