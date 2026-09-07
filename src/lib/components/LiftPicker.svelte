<script lang="ts">
	import { LIFTS } from '$lib/domain/lifts';
	import type { LiftId } from '$lib/domain/types';

	interface Props {
		selected: LiftId;
		/** Lifts the user has already entered a top set for. */
		filled: LiftId[];
		onselect: (id: LiftId) => void;
	}

	let { selected, filled, onselect }: Props = $props();
</script>

<nav class="picker" aria-label="Lift">
	{#each LIFTS as lift (lift.id)}
		<button
			type="button"
			class:selected={selected === lift.id}
			aria-current={selected === lift.id ? 'true' : undefined}
			onclick={() => onselect(lift.id)}
		>
			{lift.shortName}
			{#if filled.includes(lift.id)}
				<span class="dot" aria-label="entered"></span>
			{/if}
		</button>
	{/each}
</nav>

<style>
	.picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.87rem;
		font-weight: 500;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			border-color 0.12s ease,
			color 0.12s ease,
			background 0.12s ease;
	}

	button:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	button.selected {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
		font-weight: 600;
	}

	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.55;
	}
</style>
