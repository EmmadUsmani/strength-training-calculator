<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { planner } from '$lib/state/planner.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Restore anything typed earlier in the tab, then keep the mirror current.
	// Purely a convenience: the app never reads it back to compute a prescription,
	// and `persist` stays inert until `hydrate` has run.
	onMount(() => planner.hydrate());

	$effect(() => {
		planner.persist();
	});
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
		Weights in pounds, rounded to the nearest 2.5 lb. Everything is computed in your browser —
		nothing is uploaded.
	</p>
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
