<script lang="ts">
	import NumberField from './ui/NumberField.svelte';
	import Toggle from './ui/Toggle.svelte';
	import type { LiftConfig } from '$lib/domain/types';
	import type { LiftEntry } from '$lib/state/planner.svelte';

	interface Props {
		lift: LiftConfig;
		entry: LiftEntry;
		forceExtendedWarmup: boolean;
		onweight: (weight: number | null) => void;
		onreps: (reps: number | null) => void;
		ongrindy: (grindy: boolean) => void;
		onpreviousmiss: (missed: boolean) => void;
		onextendedwarmup: (extended: boolean) => void;
	}

	let {
		lift,
		entry,
		forceExtendedWarmup,
		onweight,
		onreps,
		ongrindy,
		onpreviousmiss,
		onextendedwarmup
	}: Props = $props();

	const missed = $derived((entry.lastTopSetReps ?? 0) < lift.topSetReps);
	const repsHint = $derived(
		lift.model === 'rep'
			? `The rep ladder runs ${lift.topSetReps}-${lift.maxTopSetReps}; the weight only moves at ${lift.maxTopSetReps}.`
			: `Target is ${lift.topSetReps}. Anything less counts as a miss.`
	);
</script>

<div class="form">
	<div class="row">
		<NumberField
			id="last-weight"
			label="Top set weight"
			value={entry.lastTopSetWeight}
			suffix="lb"
			min={0}
			step={2.5}
			placeholder="0"
			hint="The weight on the bar for your top set last {lift.name} session."
			onchange={onweight}
		/>

		<NumberField
			id="last-reps"
			label="Reps completed"
			value={entry.lastTopSetReps}
			min={0}
			max={30}
			step={1}
			placeholder={String(lift.topSetReps)}
			hint={repsHint}
			onchange={onreps}
		/>
	</div>

	{#if missed}
		<div class="conditional">
			<Toggle
				id="previous-miss"
				label="I also missed the session before that"
				hint="Two misses in a row triggers the 10% deload instead of another repeat."
				checked={entry.previousSessionMissed}
				onchange={onpreviousmiss}
			/>
		</div>
	{:else}
		<Toggle
			id="grindy"
			label="It was a grind — repeat the weight"
			hint="Hit the reps, but the last one or two were a fight. Holds the top set for one more session instead of adding load."
			checked={entry.grindy}
			onchange={ongrindy}
		/>
	{/if}

	<Toggle
		id="extended-warmup"
		label="Use the longer warm-up ramp"
		hint="Worth it after a layoff. It is applied automatically after a deload or a 10 lb+ jump."
		checked={forceExtendedWarmup}
		onchange={onextendedwarmup}
	/>
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.conditional {
		padding: 0.75rem 0.85rem;
		background: var(--caution-soft);
		border-radius: var(--radius-sm);
	}
</style>
