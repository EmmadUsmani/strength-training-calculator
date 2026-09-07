<script lang="ts">
	import NumberField from './ui/NumberField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import Toggle from './ui/Toggle.svelte';
	import type { LiftConfig, TopSetOutcome } from '$lib/domain/types';
	import type { LiftEntry } from '$lib/state/planner.svelte';

	interface Props {
		lift: LiftConfig;
		entry: LiftEntry;
		forceExtendedWarmup: boolean;
		onweight: (weight: number | null) => void;
		onreps: (reps: number | null) => void;
		onoutcome: (outcome: TopSetOutcome) => void;
		onpreviousmiss: (missed: boolean) => void;
		onextendedwarmup: (extended: boolean) => void;
	}

	let {
		lift,
		entry,
		forceExtendedWarmup,
		onweight,
		onreps,
		onoutcome,
		onpreviousmiss,
		onextendedwarmup
	}: Props = $props();

	const outcomeOptions: { value: TopSetOutcome; label: string; description: string }[] = [
		{
			value: 'clean',
			label: 'Clean',
			description: 'All target reps with good bar speed and form'
		},
		{
			value: 'grind',
			label: 'Grindy',
			description: 'Hit the reps, but the last one or two were a fight'
		},
		{ value: 'miss', label: 'Missed', description: 'Came up short of the rep target' }
	];

	const repTargetLabel = $derived(
		lift.model === 'rep'
			? `Reps completed (${lift.topSetReps}-${lift.maxTopSetReps} ladder)`
			: `Reps completed (target ${lift.topSetReps})`
	);
</script>

<div class="form">
	<div class="row">
		<NumberField
			id="last-weight"
			label="Last top set"
			value={entry.lastTopSetWeight}
			suffix="lb"
			min={0}
			step={2.5}
			placeholder="0"
			hint="The weight on the bar for your top set last {lift.name} session."
			onchange={onweight}
		/>

		{#if lift.model === 'rep'}
			<NumberField
				id="last-reps"
				label={repTargetLabel}
				value={entry.lastTopSetReps}
				min={1}
				max={lift.maxTopSetReps}
				step={1}
				placeholder={String(lift.topSetReps)}
				hint="Reps climb before weight does, so the calculator needs the count."
				onchange={onreps}
			/>
		{/if}
	</div>

	<SegmentedControl
		legend="How did that top set go?"
		options={outcomeOptions}
		value={entry.outcome}
		onchange={onoutcome}
	/>

	{#if entry.outcome === 'miss'}
		<div class="conditional">
			<Toggle
				id="previous-miss"
				label="I also missed the session before that"
				hint="Two misses in a row triggers the 10% deload instead of another repeat."
				checked={entry.previousSessionMissed}
				onchange={onpreviousmiss}
			/>
		</div>
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
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 1rem;
	}

	.conditional {
		padding: 0.75rem 0.85rem;
		background: var(--caution-soft);
		border-radius: var(--radius-sm);
	}
</style>
