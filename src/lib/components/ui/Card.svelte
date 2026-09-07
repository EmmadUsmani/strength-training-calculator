<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		/** Rendered at the top-right of the header. */
		actions?: Snippet;
		children: Snippet;
	}

	let { title, subtitle, actions, children }: Props = $props();
</script>

<section class="card">
	{#if title || actions}
		<header>
			<div>
				{#if title}<h2>{title}</h2>{/if}
				{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
			</div>
			{#if actions}<div class="actions">{@render actions()}</div>{/if}
		</header>
	{/if}
	{@render children()}
</section>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 1.15rem 1.25rem 1.25rem;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin-bottom: 0.9rem;
	}

	.subtitle {
		margin-top: 0.2rem;
		color: var(--text-muted);
		font-size: 0.85rem;
		max-width: var(--measure);
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	@media (max-width: 34rem) {
		.card {
			padding: 1rem 0.85rem 1.1rem;
		}
	}
</style>
