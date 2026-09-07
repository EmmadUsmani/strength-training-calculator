<script lang="ts">
	import Badge from './ui/Badge.svelte';
	import { formatNumber, formatWeight } from '$lib/domain/rounding';
	import { formatSessionDate } from '$lib/domain/schedule';
	import type { ProjectedSession } from '$lib/domain/projection';
	import type { LiftConfig, ProgressionAction } from '$lib/domain/types';

	interface Props {
		sessions: ProjectedSession[];
		lift: LiftConfig;
	}

	let { sessions, lift }: Props = $props();

	const ACTION_LABELS: Record<ProgressionAction, string> = {
		'advance-load': '+ weight',
		'advance-reps': '+ rep',
		hold: 'repeat',
		deload: 'deload'
	};

	const ACTION_TONES: Record<ProgressionAction, 'positive' | 'caution' | 'negative'> = {
		'advance-load': 'positive',
		'advance-reps': 'positive',
		hold: 'caution',
		deload: 'negative'
	};

	const backoffColumns = $derived(lift.backoffs.length);
	const showDates = $derived(sessions.some((session) => session.date !== null));
	const first = $derived(sessions[0]);
	const last = $derived(sessions.at(-1));
	const totalGain = $derived(first && last ? last.topSet.weight - first.topSet.weight : 0);
	const resets = $derived(sessions.filter((session) => session.backoff.recalculate).length);
</script>

<div class="scroller">
	<table>
		<caption class="visually-hidden">Projected {lift.name} sessions</caption>
		<thead>
			<tr>
				<th scope="col">Session</th>
				<th scope="col" class="num">Week</th>
				{#if showDates}<th scope="col">Date</th>{/if}
				<th scope="col" class="num">Top set</th>
				<th scope="col" class="num">Reps</th>
				{#each { length: backoffColumns } as _, index (index)}
					<th scope="col" class="num backoff">
						{backoffColumns === 1 ? 'Back-off' : `Back-off ${index + 1}`}
					</th>
				{/each}
				<th scope="col">Move</th>
			</tr>
		</thead>
		<tbody>
			{#each sessions as session (session.session)}
				<tr
					class:deload={session.topSet.action === 'deload'}
					class:reset={session.backoff.recalculate}
				>
					<th scope="row">
						{session.session === 1 ? 'Next' : `+${session.session - 1}`}
					</th>
					<td class="num numeric muted">{session.week}</td>
					{#if showDates}
						<td class="muted date">{session.date ? formatSessionDate(session.date) : '—'}</td>
					{/if}
					<td class="num numeric strong">{formatWeight(session.topSet.weight)}</td>
					<td class="num numeric">{session.topSet.targetReps}</td>
					{#each session.backoffWeights as weight, index (index)}
						<td class="num numeric muted backoff" class:fresh={session.backoff.recalculate}>
							{formatNumber(weight)}
						</td>
					{/each}
					<td>
						<Badge tone={ACTION_TONES[session.topSet.action]}>
							{ACTION_LABELS[session.topSet.action]}
						</Badge>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if first && last && sessions.length > 1}
	<p class="summary">
		{sessions.length} sessions from {formatWeight(first.topSet.weight)} to
		{formatWeight(last.topSet.weight)} —
		{totalGain >= 0 ? 'a gain of' : 'a drop of'}
		{formatWeight(Math.abs(totalGain))} on the top set, with
		{resets}
		back-off {resets === 1 ? 'reset' : 'resets'} along the way (shown in bold).
	</p>
{/if}

<style>
	.scroller {
		overflow-x: auto;
		margin: 0 -0.25rem;
		padding: 0 0.25rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.87rem;
	}

	thead th {
		text-align: left;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-faint);
		padding: 0 0.6rem 0.45rem;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}

	thead th.num {
		text-align: right;
	}

	tbody th {
		text-align: left;
		font-weight: 500;
		color: var(--text-muted);
		padding: 0.45rem 0.6rem;
		white-space: nowrap;
	}

	td {
		padding: 0.45rem 0.6rem;
		white-space: nowrap;
	}

	tbody tr + tr th,
	tbody tr + tr td {
		border-top: 1px solid var(--border);
	}

	.num {
		text-align: right;
	}

	.strong {
		font-weight: 600;
	}

	.muted {
		color: var(--text-faint);
	}

	/* A session that resets the back-off block is the one worth spotting. */
	.backoff.fresh {
		color: var(--text);
		font-weight: 650;
	}

	tbody tr.reset td.backoff {
		border-top-color: var(--border-strong);
	}

	tbody tr:first-child {
		background: var(--accent-soft);
	}

	tbody tr:first-child th,
	tbody tr:first-child td.strong {
		color: var(--accent-text);
		font-weight: 650;
	}

	tbody tr.deload td.strong {
		color: var(--negative);
	}

	.summary {
		margin-top: 0.9rem;
		font-size: 0.85rem;
		color: var(--text-muted);
		max-width: var(--measure);
	}

	@media (max-width: 34rem) {
		table {
			font-size: 0.75rem;
		}

		thead th {
			padding: 0 0.22rem 0.4rem;
			font-size: 0.6rem;
			letter-spacing: 0.02em;
		}

		tbody th,
		td {
			padding: 0.45rem 0.22rem;
		}

		/* Even trimmed, this many columns will not fit a phone. Drop the back-offs —
		   they are already spelled out on the next-workout page — so the top set,
		   the date and the progression verdict stay visible without scrolling. */
		.backoff {
			display: none;
		}
	}
</style>
