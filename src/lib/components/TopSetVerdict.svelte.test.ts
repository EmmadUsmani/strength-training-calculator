import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TopSetVerdict from './TopSetVerdict.svelte';
import { BENCH } from '$lib/domain/lifts';
import { nextTopSet } from '$lib/domain/progression';
import { makeInput } from '$lib/domain/testing';

describe('TopSetVerdict', () => {
	it('shows the prescription and an "add weight" verdict after a clean set', () => {
		const topSet = nextTopSet(makeInput({ lastTopSetWeight: 105, lastTopSetReps: 5 }), BENCH);
		render(TopSetVerdict, { topSet });
		expect(screen.getByText('107.5 lb')).toBeInTheDocument();
		expect(screen.getByText('Add weight')).toBeInTheDocument();
		expect(screen.getByText('+2.5 lb')).toBeInTheDocument();
	});

	it('shows a repeat verdict and hides the delta when nothing moves', () => {
		const topSet = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 5, grindy: true }),
			BENCH
		);
		render(TopSetVerdict, { topSet });
		expect(screen.getByText('Repeat')).toBeInTheDocument();
		expect(screen.queryByText(/lb$/, { selector: '.badge' })).not.toBeInTheDocument();
	});

	it('shows a deload verdict with a negative delta after two misses', () => {
		const topSet = nextTopSet(
			makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3, previousSessionMissed: true }),
			BENCH
		);
		render(TopSetVerdict, { topSet });
		expect(screen.getByText('Deload 10%')).toBeInTheDocument();
		expect(screen.getByText('-10 lb')).toBeInTheDocument();
		expect(screen.getByText('95 lb')).toBeInTheDocument();
	});

	it('always explains itself', () => {
		const topSet = nextTopSet(makeInput({ lastTopSetWeight: 105, lastTopSetReps: 3 }), BENCH);
		render(TopSetVerdict, { topSet });
		expect(screen.getByText(topSet.rationale)).toBeInTheDocument();
	});
});
