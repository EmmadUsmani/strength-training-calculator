<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LiftPicker from '$lib/components/LiftPicker.svelte';
	import ProgressionTable from '$lib/components/ProgressionTable.svelte';
	import ScheduleForm from '$lib/components/ScheduleForm.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import {
		SCENARIO_DESCRIPTIONS,
		SCENARIO_LABELS,
		type ProjectionScenario
	} from '$lib/domain/projection';
	import { fromDateInputValue } from '$lib/domain/schedule';
	import { planner } from '$lib/state/planner.svelte';

	const scenarios = (Object.keys(SCENARIO_LABELS) as ProjectionScenario[]).map((value) => ({
		value,
		label: SCENARIO_LABELS[value],
		description: SCENARIO_DESCRIPTIONS[value]
	}));

	const lengths = [
		{ value: '6', label: '6' },
		{ value: '8', label: '8' },
		{ value: '12', label: '12' },
		{ value: '20', label: '20' }
	];

	const sessions = $derived(planner.projection);
</script>

<svelte:head>
	<title>Progression · Top Set</title>
	<meta
		name="description"
		content="Project how your top set and back-off weights move over the coming sessions."
	/>
</svelte:head>

<div class="page">
	<div class="intro">
		<h1>Where this goes</h1>
		<p>
			The same rules, run forward. Session 1 is the workout the calculator is prescribing now; each
			row after it assumes the outcome you pick below, and the back-off block resets on its own
			schedule.
		</p>
	</div>

	<LiftPicker
		selected={planner.selectedLiftId}
		filled={planner.filledLiftIds}
		onselect={(id) => planner.selectLift(id)}
	/>

	<Card title="Schedule" subtitle="Sets the pace of the projection, and the back-off block's time-based reset.">
		<ScheduleForm
			lift={planner.lift}
			sessionsPerWeek={planner.sessionsPerWeek}
			lastSessionDate={planner.lastSessionDate}
			onsessionsperweek={(value) => (planner.sessionsPerWeek = value ?? 2)}
			ondate={(value) => {
				const parsed = fromDateInputValue(value);
				if (parsed) planner.lastSessionDate = parsed;
			}}
		/>
	</Card>

	{#if sessions.length}
		<Card title="{planner.lift.name} projection" subtitle={SCENARIO_DESCRIPTIONS[planner.scenario]}>
			{#snippet actions()}
				<div class="controls">
					<SegmentedControl
						legend="Sessions"
						showLegend={false}
						options={lengths}
						value={String(planner.sessionCount)}
						onchange={(value) => (planner.sessionCount = Number(value))}
					/>
				</div>
			{/snippet}

			<div class="stack">
				<SegmentedControl
					legend="Assume"
					options={scenarios}
					value={planner.scenario}
					onchange={(value) => (planner.scenario = value)}
				/>
				<ProgressionTable {sessions} lift={planner.lift} />
			</div>
		</Card>
	{:else}
		<EmptyState
			title="Nothing to project yet"
			message="Enter your last {planner.lift
				.name} top set on the calculator page and the projection fills in here."
		/>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.intro p {
		margin-top: 0.45rem;
		color: var(--text-muted);
		max-width: var(--measure);
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.controls {
		min-width: 11rem;
	}
</style>
