<script lang="ts">
	import BackoffStatus from './BackoffStatus.svelte';
	import Card from './ui/Card.svelte';
	import SetTable from './SetTable.svelte';
	import TopSetVerdict from './TopSetVerdict.svelte';
	import type { WorkoutPlan } from '$lib/domain/types';

	interface Props {
		plan: WorkoutPlan;
	}

	let { plan }: Props = $props();

	const workingSetCount = $derived(
		plan.sets.filter((set) => set.kind === 'top' || set.kind === 'backoff').length
	);
</script>

<Card
	title="Next {plan.lift.name} session"
	subtitle="{plan.sets.length} sets total — {workingSetCount} of them working sets."
>
	<div class="stack">
		<TopSetVerdict topSet={plan.topSet} />

		<SetTable sets={plan.sets} lift={plan.lift} />

		<BackoffStatus backoff={plan.backoff} />

		{#if plan.notes.length}
			<ul class="notes">
				{#each plan.notes as note (note)}
					<li>{note}</li>
				{/each}
			</ul>
		{/if}

		<details>
			<summary>Why {plan.lift.name} is programmed this way</summary>
			<ul class="coaching">
				{#each plan.lift.coachingNotes as note (note)}
					<li>{note}</li>
				{/each}
			</ul>
		</details>
	</div>
</Card>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.notes,
	.coaching {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--text-muted);
		max-width: var(--measure);
	}

	.notes li::marker {
		color: var(--accent);
	}

	details {
		border-top: 1px solid var(--border);
		padding-top: 0.8rem;
	}

	summary {
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-muted);
	}

	summary:hover {
		color: var(--text);
	}

	details[open] summary {
		margin-bottom: 0.7rem;
	}
</style>
