<script lang="ts">
	import NumberField from './ui/NumberField.svelte';
	import { toDateInputValue } from '$lib/domain/schedule';
	import type { LiftConfig } from '$lib/domain/types';

	interface Props {
		lift: LiftConfig;
		sessionsPerWeek: number;
		lastSessionDate: Date;
		onsessionsperweek: (sessions: number | null) => void;
		ondate: (value: string) => void;
	}

	let { lift, sessionsPerWeek, lastSessionDate, onsessionsperweek, ondate }: Props = $props();
</script>

<div class="row">
	<NumberField
		id="projection-frequency"
		label="Sessions per week"
		value={sessionsPerWeek}
		min={0.25}
		max={7}
		step={0.5}
		placeholder="2"
		hint="How often you train {lift.name}. 1.5 means three sessions a fortnight."
		onchange={onsessionsperweek}
	/>

	<div class="field">
		<label for="projection-date">Last session</label>
		<div class="control">
			<input
				id="projection-date"
				type="date"
				value={toDateInputValue(lastSessionDate)}
				onchange={(event) => ondate(event.currentTarget.value)}
			/>
		</div>
		<p class="hint">Dates count forward from here. Defaults to today.</p>
	</div>
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.field {
		min-width: 0;
	}

	label {
		display: block;
		margin-bottom: 0.4rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.control {
		display: flex;
		align-items: center;
		background: var(--surface-sunken);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.control:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		padding: 0.5rem 0.65rem;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 1rem;
		color: var(--text);
	}

	input:focus {
		outline: none;
	}

	.hint {
		margin-top: 0.35rem;
		font-size: 0.78rem;
		color: var(--text-faint);
	}
</style>
