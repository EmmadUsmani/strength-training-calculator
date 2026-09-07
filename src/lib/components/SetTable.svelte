<script lang="ts">
	import { formatWeight } from '$lib/domain/rounding';
	import type { LiftConfig, PrescribedSet } from '$lib/domain/types';

	interface Props {
		sets: PrescribedSet[];
		lift: LiftConfig;
	}

	let { sets, lift }: Props = $props();
</script>

<div class="scroller">
	<table>
		<caption class="visually-hidden">Prescribed sets for {lift.name}</caption>
		<thead>
			<tr>
				<th scope="col">Set</th>
				<th scope="col" class="num">Weight</th>
				<th scope="col" class="num">Reps</th>
				<th scope="col" class="num">% top</th>
				<th scope="col">Rest after</th>
			</tr>
		</thead>
		<tbody>
			{#each sets as set, index (index)}
				<tr class={set.kind} class:optional={set.optional}>
					<th scope="row">
						<span class="label">{set.label}</span>
						{#if set.exercise}<span class="exercise">{set.exercise}</span>{/if}
						{#if set.optional}<span class="optional-tag">optional</span>{/if}
					</th>
					<td class="num numeric">
						{#if set.weight === null}
							<span class="muted">your call</span>
						{:else}
							{formatWeight(set.weight)}
						{/if}
					</td>
					<td class="num numeric">{set.reps}</td>
					<td class="num numeric muted">
						{set.percentOfTop === null ? '—' : `${set.percentOfTop}%`}
					</td>
					<td class="muted">{set.rest}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scroller {
		overflow-x: auto;
		margin: 0 -0.25rem;
		padding: 0 0.25rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
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

	tbody th {
		text-align: left;
		font-weight: 500;
		padding: 0.5rem 0.6rem;
		white-space: nowrap;
	}

	td {
		padding: 0.5rem 0.6rem;
		white-space: nowrap;
	}

	tbody tr + tr th,
	tbody tr + tr td {
		border-top: 1px solid var(--border);
	}

	.num {
		text-align: right;
	}

	.muted {
		color: var(--text-faint);
	}

	/* The top set is the point of the session, so it gets the visual weight. */
	tr.top {
		background: var(--accent-soft);
	}

	tr.top th,
	tr.top td {
		font-weight: 650;
		color: var(--accent-text);
	}

	tr.warmup th .label,
	tr.finisher th .label {
		color: var(--text-muted);
	}

	tr.optional td:not(.num),
	tr.optional th {
		opacity: 0.85;
	}

	/* On a phone the whole prescription should be readable without scrolling
	   sideways, so trade padding and type size for fitting every column. */
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
	}

	.exercise {
		display: block;
		font-size: 0.75rem;
		color: var(--text-faint);
	}

	.optional-tag {
		margin-left: 0.35rem;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-faint);
	}
</style>
