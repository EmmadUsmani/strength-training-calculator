<script lang="ts">
	import NumberField from './ui/NumberField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import { RECALC_MOVEMENT_LB, RECALC_WEEKS, recalcSessionLimit } from '$lib/domain/backoff';
	import { formatNumber } from '$lib/domain/rounding';
	import type { BackoffMode, LiftConfig } from '$lib/domain/types';
	import type { LiftEntry } from '$lib/state/planner.svelte';

	interface Props {
		lift: LiftConfig;
		entry: LiftEntry;
		sessionsPerWeek: number;
		onbackoffweight: (weight: number | null) => void;
		onbackoffreps: (reps: number | null) => void;
		onbackoffsessions: (sessions: number | null) => void;
		onbackoffmode: (mode: BackoffMode) => void;
		onsessionsperweek: (sessions: number | null) => void;
	}

	let {
		lift,
		entry,
		sessionsPerWeek,
		onbackoffweight,
		onbackoffreps,
		onbackoffsessions,
		onbackoffmode,
		onsessionsperweek
	}: Props = $props();

	const spec = $derived(lift.backoffs[0]);
	const sessionLimit = $derived(recalcSessionLimit(sessionsPerWeek));

	const modes: { value: BackoffMode; label: string; description: string }[] = $derived([
		{
			value: 'auto',
			label: 'Auto',
			description: `Reset once the top set is up ${RECALC_MOVEMENT_LB} lb, or after ${sessionLimit} sessions on this weight.`
		},
		{ value: 'hold', label: 'Hold', description: 'Keep the current back-off weight regardless.' },
		{
			value: 'recalculate',
			label: 'Reset now',
			description: 'Recalculate the block off today’s top set regardless.'
		}
	]);
</script>

<div class="form">
	<div class="row">
		<NumberField
			id="backoff-weight"
			label="Back-off weight"
			value={entry.backoffWeight}
			suffix="lb"
			min={0}
			step={2.5}
			placeholder="—"
			hint="Your heaviest back-off set last session. Leave blank to calculate a fresh block."
			onchange={onbackoffweight}
		/>

		<NumberField
			id="backoff-reps"
			label="Back-off reps"
			value={entry.backoffReps}
			min={0}
			max={30}
			step={1}
			placeholder={String(spec.minReps)}
			hint="Reps you completed on those sets. They climb to {spec.maxReps} before the weight moves."
			onchange={onbackoffreps}
		/>

		<NumberField
			id="backoff-sessions"
			label="Sessions at this weight"
			value={entry.backoffSessions}
			min={1}
			max={52}
			step={1}
			placeholder="1"
			hint="Including last session. The block resets after {sessionLimit} ({RECALC_WEEKS} weeks at this frequency)."
			onchange={onbackoffsessions}
		/>

		<NumberField
			id="sessions-per-week"
			label="Sessions per week"
			value={sessionsPerWeek}
			min={0.25}
			max={7}
			step={0.5}
			placeholder="2"
			hint="How often you train {lift.name}. Fractions are fine — 1.5 is three sessions a fortnight."
			onchange={onsessionsperweek}
		/>
	</div>

	<SegmentedControl
		legend="Back-off block"
		options={modes}
		value={entry.backoffMode}
		onchange={onbackoffmode}
	/>

	{#if entry.backoffMode !== 'auto'}
		<p class="override">
			Manual override in effect — {entry.backoffMode === 'hold'
				? 'the block is held no matter how far the top set has moved.'
				: `the block resets off today’s top set. ${formatNumber(sessionsPerWeek)}×/week would normally reset it after ${sessionLimit} sessions.`}
		</p>
	{/if}
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

	.override {
		font-size: 0.82rem;
		color: var(--caution);
		background: var(--caution-soft);
		border-radius: var(--radius-sm);
		padding: 0.55rem 0.75rem;
		max-width: var(--measure);
	}
</style>
