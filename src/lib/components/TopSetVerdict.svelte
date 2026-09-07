<script lang="ts">
	import Badge from './ui/Badge.svelte';
	import { formatDelta, formatWeight } from '$lib/domain/rounding';
	import type { ProgressionAction, TopSetPrescription } from '$lib/domain/types';

	interface Props {
		topSet: TopSetPrescription;
	}

	let { topSet }: Props = $props();

	const TONES: Record<ProgressionAction, 'positive' | 'caution' | 'negative' | 'accent'> = {
		'advance-load': 'positive',
		'advance-reps': 'positive',
		hold: 'caution',
		deload: 'negative'
	};

	const LABELS: Record<ProgressionAction, string> = {
		'advance-load': 'Add weight',
		'advance-reps': 'Add a rep',
		hold: 'Repeat',
		deload: 'Deload 10%'
	};

	const tone = $derived(TONES[topSet.action]);
</script>

<div class="verdict {tone}">
	<div class="headline">
		<div class="prescription">
			<span class="weight numeric">{formatWeight(topSet.weight)}</span>
			<span class="times">×</span>
			<span class="reps numeric">{topSet.targetReps}</span>
		</div>
		<div class="tags">
			<Badge {tone}>{LABELS[topSet.action]}</Badge>
			{#if topSet.weightDelta !== 0}
				<Badge tone="neutral">{formatDelta(topSet.weightDelta)} lb</Badge>
			{/if}
		</div>
	</div>
	<p class="rationale">{topSet.rationale}</p>
</div>

<style>
	.verdict {
		border-left: 3px solid var(--border-strong);
		padding-left: 0.9rem;
	}

	.verdict.positive {
		border-color: var(--positive);
	}
	.verdict.caution {
		border-color: var(--caution);
	}
	.verdict.negative {
		border-color: var(--negative);
	}

	.headline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.prescription {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.weight {
		font-size: 1.75rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.times {
		color: var(--text-faint);
		font-size: 1.1rem;
	}

	.reps {
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.tags {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.rationale {
		margin-top: 0.4rem;
		color: var(--text-muted);
		font-size: 0.87rem;
		max-width: var(--measure);
	}
</style>
