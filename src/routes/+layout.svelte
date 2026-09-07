<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import { setPlanner } from '$lib/state/planner.svelte';

	let { children } = $props();

	// One planner for this render, shared by every page under the layout.
	setPlanner();
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
		what you type — nothing is uploaded, and nothing is stored between visits.
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
