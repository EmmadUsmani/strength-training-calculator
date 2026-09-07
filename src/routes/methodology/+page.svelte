<script lang="ts">
	import MethodologySection from '$lib/components/MethodologySection.svelte';
	import { METHODOLOGY, METHODOLOGY_INTRO } from '$lib/content/methodology';
</script>

<svelte:head>
	<title>Methodology · Top Set</title>
	<meta
		name="description"
		content="The rules this calculator follows: one top set, back-off volume, and clean-rep-gated progression."
	/>
</svelte:head>

<article class="page">
	<div class="intro">
		<h1>The rules this follows</h1>
		<p>{METHODOLOGY_INTRO}</p>
	</div>

	<nav aria-label="On this page">
		{#each METHODOLOGY as section (section.id)}
			<a href="#{section.id}">{section.heading}</a>
		{/each}
	</nav>

	{#each METHODOLOGY as section (section.id)}
		<MethodologySection {section} />
	{/each}
</article>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.intro p {
		margin-top: 0.6rem;
		color: var(--text-muted);
		max-width: var(--measure);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	nav a {
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.82rem;
		color: var(--text-muted);
		text-decoration: none;
	}

	nav a:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}
</style>
