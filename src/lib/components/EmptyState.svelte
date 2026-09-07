<script lang="ts">
	interface Props {
		title: string;
		message: string;
	}

	let { title, message }: Props = $props();
</script>

<div class="empty">
	<h3>{title}</h3>
	<p>{message}</p>
</div>

<style>
	.empty {
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		padding: 2rem 1.25rem;
		text-align: center;
		color: var(--text-muted);
	}

	h3 {
		color: var(--text);
		margin-bottom: 0.3rem;
	}

	p {
		font-size: 0.87rem;
		max-width: 42ch;
		margin: 0 auto;
	}
</style>
