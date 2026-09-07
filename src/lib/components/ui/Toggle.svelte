<script lang="ts">
	interface Props {
		id: string;
		label: string;
		hint?: string;
		checked: boolean;
		onchange: (checked: boolean) => void;
	}

	let { id, label, hint, checked, onchange }: Props = $props();
</script>

<div class="toggle">
	<input
		{id}
		type="checkbox"
		{checked}
		onchange={(event) => onchange(event.currentTarget.checked)}
	/>
	<div>
		<label for={id}>{label}</label>
		{#if hint}<p class="hint">{hint}</p>{/if}
	</div>
</div>

<style>
	.toggle {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
	}

	input {
		margin: 0.25rem 0 0;
		accent-color: var(--accent);
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	label {
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
	}

	.hint {
		margin-top: 0.15rem;
		font-size: 0.78rem;
		color: var(--text-faint);
		max-width: var(--measure);
	}
</style>
