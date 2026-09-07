<script lang="ts">
	interface Props {
		id: string;
		label: string;
		value: number | null;
		hint?: string;
		suffix?: string;
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
		onchange: (value: number | null) => void;
	}

	let {
		id,
		label,
		value,
		hint,
		suffix,
		min,
		max,
		step = 2.5,
		placeholder,
		onchange
	}: Props = $props();

	function handleInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		if (raw.trim() === '') return onchange(null);
		const parsed = Number(raw);
		onchange(Number.isFinite(parsed) ? parsed : null);
	}
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="control">
		<input
			{id}
			type="number"
			inputmode="decimal"
			value={value ?? ''}
			{min}
			{max}
			{step}
			{placeholder}
			oninput={handleInput}
		/>
		{#if suffix}<span class="suffix">{suffix}</span>{/if}
	</div>
	{#if hint}<p class="hint">{hint}</p>{/if}
</div>

<style>
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
		gap: 0.4rem;
		background: var(--surface-sunken);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0 0.6rem 0 0;
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

	.suffix {
		color: var(--text-faint);
		font-size: 0.85rem;
	}

	.hint {
		margin-top: 0.35rem;
		font-size: 0.78rem;
		color: var(--text-faint);
	}
</style>
