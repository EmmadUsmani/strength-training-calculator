<script lang="ts">
	import Badge from './ui/Badge.svelte';
	import { formatNumber, formatWeight } from '$lib/domain/rounding';
	import { RECALC_MOVEMENT_LB } from '$lib/domain/backoff';
	import type { BackoffDecision } from '$lib/domain/types';

	interface Props {
		backoff: BackoffDecision;
	}

	let { backoff }: Props = $props();

	const tone = $derived(backoff.recalculate ? 'accent' : 'neutral');
	const label = $derived(backoff.recalculate ? 'Block reset' : 'Block held');

	/** How far through each trigger the current block is, for the meters. */
	const movementProgress = $derived(
		backoff.movement === null
			? null
			: Math.min(1, Math.max(0, backoff.movement / RECALC_MOVEMENT_LB))
	);
	const sessionProgress = $derived(
		Math.min(1, Math.max(0, backoff.sessionsUsed / backoff.sessionLimit))
	);
</script>

<div class="status">
	<div class="head">
		<h3>Back-off block</h3>
		<Badge {tone}>{label}</Badge>
	</div>
	<p class="reason">{backoff.reason}</p>

	{#if backoff.anchor !== null && backoff.movement !== null}
		<dl class="meters">
			<div>
				<dt>Top set movement</dt>
				<dd>
					<span class="numeric"
						>{formatNumber(Math.max(0, backoff.movement))} / {RECALC_MOVEMENT_LB} lb</span
					>
					<span class="track"
						><span class="fill" style="width: {(movementProgress ?? 0) * 100}%"></span></span
					>
					<span class="foot">anchored at {formatWeight(backoff.anchor)}</span>
				</dd>
			</div>
			<div>
				<dt>Sessions on this weight</dt>
				<dd>
					<span class="numeric">{backoff.sessionsUsed} / {backoff.sessionLimit}</span>
					<span class="track"
						><span class="fill" style="width: {sessionProgress * 100}%"></span></span
					>
					<span class="foot">time-based fallback</span>
				</dd>
			</div>
		</dl>
	{/if}
</div>

<style>
	.status {
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.8rem 0.9rem;
		background: var(--surface-sunken);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	h3 {
		font-size: 0.82rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.reason {
		font-size: 0.85rem;
		color: var(--text-muted);
		max-width: var(--measure);
	}

	.meters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.9rem;
		margin: 0.9rem 0 0;
	}

	dt {
		font-size: 0.72rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: 0.25rem;
	}

	dd {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
	}

	.track {
		height: 4px;
		border-radius: 2px;
		background: var(--border);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--accent);
	}

	.foot {
		font-size: 0.75rem;
		color: var(--text-faint);
	}
</style>
