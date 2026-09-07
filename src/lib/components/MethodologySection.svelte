<script lang="ts">
	import type { MethodologySection } from '$lib/content/methodology';

	interface Props {
		section: MethodologySection;
	}

	let { section }: Props = $props();
</script>

<section id={section.id}>
	<h2>{section.heading}</h2>
	{#each section.body as paragraph (paragraph)}
		<p>{paragraph}</p>
	{/each}
	{#if section.rules}
		<dl>
			{#each section.rules as rule (rule.term)}
				<div class="rule">
					<dt>{rule.term}</dt>
					<dd>{rule.detail}</dd>
				</div>
			{/each}
		</dl>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scroll-margin-top: 1rem;
	}

	h2 {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	p {
		max-width: var(--measure);
		color: var(--text-muted);
	}

	dl {
		margin: 0.15rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.rule {
		display: grid;
		grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
		gap: 0.25rem 1.5rem;
		align-items: baseline;
	}

	dt {
		font-weight: 600;
		font-size: 0.9rem;
	}

	dd {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9rem;
		max-width: var(--measure);
	}

	@media (max-width: 40rem) {
		.rule {
			grid-template-columns: 1fr;
		}
	}
</style>
