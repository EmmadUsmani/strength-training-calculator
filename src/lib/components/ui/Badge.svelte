<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'neutral' | 'accent' | 'positive' | 'caution' | 'negative';

	interface Props {
		tone?: Tone;
		children: Snippet;
	}

	let { tone = 'neutral', children }: Props = $props();
</script>

<span class="badge {tone}">{@render children()}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: var(--radius-sm);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
		background: var(--surface-sunken);
		color: var(--text-muted);
	}

	.accent {
		background: var(--accent-soft);
		color: var(--accent-text);
	}
	.positive {
		background: var(--positive-soft);
		color: var(--positive);
	}
	.caution {
		background: var(--caution-soft);
		color: var(--caution);
	}
	.negative {
		background: var(--negative-soft);
		color: var(--negative);
	}
</style>
