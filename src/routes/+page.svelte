<script lang="ts">
	import BackoffBlockForm from '$lib/components/BackoffBlockForm.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LiftPicker from '$lib/components/LiftPicker.svelte';
	import SessionInputForm from '$lib/components/SessionInputForm.svelte';
	import WorkoutPlanView from '$lib/components/WorkoutPlanView.svelte';
	import { getPlanner } from '$lib/state/planner.svelte';
	import { base } from '$app/paths';

	const planner = getPlanner();
	const entry = $derived(planner.entry);
	const plan = $derived(planner.plan);
</script>

<svelte:head>
	<title>Next workout · Top Set</title>
	<meta
		name="description"
		content="Work out your next top set, back-offs and warm-up ramp from your last session."
	/>
</svelte:head>

<div class="page">
	<div class="intro">
		<h1>What should I lift next?</h1>
		<p>
			Tell it what you did on your last top set and back-offs, and it prescribes the whole next
			session — warm-up ramp, one top set, back-offs and the optional finisher.
		</p>
	</div>

	<LiftPicker
		selected={planner.selectedLiftId}
		filled={planner.filledLiftIds}
		onselect={(id) => planner.selectLift(id)}
	/>

	<Card
		title="Last {planner.lift.name} top set"
		subtitle="One set is what drives progression, so this is the one the calculator gates on."
	>
		<SessionInputForm
			lift={planner.lift}
			{entry}
			forceExtendedWarmup={planner.forceExtendedWarmup}
			onweight={(weight) => (entry.lastTopSetWeight = weight)}
			onreps={(reps) => (entry.lastTopSetReps = reps)}
			ongrindy={(grindy) => (entry.grindy = grindy)}
			onpreviousmiss={(missed) => (entry.previousSessionMissed = missed)}
			onextendedwarmup={(extended) => (planner.forceExtendedWarmup = extended)}
		/>
	</Card>

	<Card
		title="Back-off block"
		subtitle="Back-offs are held at a fixed weight for a few sessions, then recalculated — they are the volume base, not another thing to test."
	>
		<BackoffBlockForm
			lift={planner.lift}
			{entry}
			sessionsPerWeek={planner.sessionsPerWeek}
			onbackoffweight={(weight) => (entry.backoffWeight = weight)}
			onbackoffreps={(reps) => (entry.backoffReps = reps)}
			onbackoffsessions={(sessions) => (entry.backoffSessions = sessions)}
			onbackoffmode={(mode) => (entry.backoffMode = mode)}
			onsessionsperweek={(sessions) => (planner.sessionsPerWeek = sessions ?? 2)}
		/>
	</Card>

	{#if plan}
		<WorkoutPlanView {plan} />
		<p class="next-link">
			Want to see where this goes? <a href="{base}/progression/">Project the next few sessions →</a>
		</p>
	{:else}
		<EmptyState
			title="Enter your last top set"
			message="Put in the weight you used for your top set last {planner.lift
				.name} session and the full prescription appears here."
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

	.next-link {
		font-size: 0.87rem;
		color: var(--text-muted);
	}

	.next-link a {
		color: var(--accent-text);
		font-weight: 500;
	}
</style>
