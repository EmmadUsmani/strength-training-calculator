<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { setPlanner } from '$lib/state/planner.svelte';
	import { clearSnapshot, loadSnapshot, saveSnapshot } from '$lib/state/storage';

	let { children } = $props();

	// One planner for this render, shared by every page under the layout.
	const planner = setPlanner();

	/**
	 * Restore what was typed last visit, then mirror every change back.
	 *
	 * This is a typing convenience only. The snapshot flows into the form fields
	 * and nowhere else — no prescription reads it — so a restored session and a
	 * hand-typed one produce identical results. `restored` gates the mirror so
	 * the first save cannot overwrite the stored form with the defaults before
	 * it has been read back.
	 */
	let restored = $state(false);

	onMount(() => {
		const snapshot = loadSnapshot(planner.toSnapshot());
		if (snapshot) planner.restore(snapshot);
		restored = true;
	});

	$effect(() => {
		// Read the snapshot unconditionally so this effect tracks the form even
		// on the render before `restored` flips.
		const snapshot = planner.toSnapshot();
		if (restored) saveSnapshot(snapshot);
	});

	function clearInputs() {
		clearSnapshot();
		planner.reset();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SiteNav />

<main>
	{@render children()}
</main>

<footer>
	<p>
		Weights in pounds, rounded to the nearest 2.5 lb. Everything is computed in your browser from
		what you type — nothing is uploaded. Your inputs are saved in this browser so you do not have to
		retype them; they only ever refill the form.
	</p>
	<button type="button" onclick={clearInputs}>Clear saved inputs</button>
</footer>

<style>
	main {
		max-width: 62rem;
		margin: 0 auto;
		padding: 1.75rem 1.25rem 3rem;
	}

	footer {
		max-width: 62rem;
		margin: 0 auto;
		padding: 0 1.25rem 2.5rem;
		font-size: 0.78rem;
		color: var(--text-faint);
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
	}

	footer p {
		max-width: var(--measure);
	}

	button {
		border: 0;
		background: none;
		padding: 0;
		font-size: inherit;
		color: var(--text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
		white-space: nowrap;
	}

	button:hover {
		color: var(--text);
	}

	/* Reclaim gutter width on phones so the set tables fit without scrolling. */
	@media (max-width: 34rem) {
		main {
			padding: 1.25rem 0.85rem 2.5rem;
		}

		footer {
			padding: 0 0.85rem 2rem;
		}
	}
</style>
