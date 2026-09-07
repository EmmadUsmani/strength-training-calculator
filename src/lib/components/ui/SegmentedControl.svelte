<script lang="ts" generics="T extends string">
	interface Option {
		value: T;
		label: string;
		description?: string;
	}

	interface Props {
		legend: string;
		options: Option[];
		value: T;
		/** Render the legend above the control instead of hiding it. */
		showLegend?: boolean;
		onchange: (value: T) => void;
	}

	let { legend, options, value, showLegend = true, onchange }: Props = $props();
</script>

<fieldset>
	<legend class={showLegend ? 'label' : 'visually-hidden'}>{legend}</legend>
	<div class="segments">
		{#each options as option (option.value)}
			<label class="segment" class:selected={value === option.value} title={option.description}>
				<input
					type="radio"
					name={legend}
					value={option.value}
					checked={value === option.value}
					onchange={() => onchange(option.value)}
				/>
				<span>{option.label}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.label {
		display: block;
		padding: 0;
		margin-bottom: 0.4rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.segments {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		padding: 3px;
		background: var(--surface-sunken);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.segment {
		flex: 1 1 auto;
		text-align: center;
		padding: 0.35rem 0.6rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-muted);
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 0.12s ease,
			color 0.12s ease;
	}

	.segment:hover {
		color: var(--text);
	}

	.segment.selected {
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
	}

	.segment:has(:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}
</style>
