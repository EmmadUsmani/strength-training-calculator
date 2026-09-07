<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Next workout' },
		{ href: '/progression', label: 'Progression' },
		{ href: '/methodology', label: 'Methodology' }
	];

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<header class="site-header">
	<div class="inner">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true"></span>
			<span>Top Set</span>
		</a>
		<nav aria-label="Sections">
			{#each links as link (link.href)}
				<a href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>
</header>

<style>
	.site-header {
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.inner {
		max-width: 62rem;
		margin: 0 auto;
		padding: 0.7rem 1.25rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 650;
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	.mark {
		width: 15px;
		height: 15px;
		border-radius: 3px;
		background: var(--accent);
	}

	nav {
		display: flex;
		gap: 0.25rem;
	}

	nav a {
		padding: 0.3rem 0.65rem;
		border-radius: var(--radius-sm);
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
	}

	nav a:hover {
		color: var(--text);
		background: var(--surface-sunken);
	}

	nav a[aria-current='page'] {
		color: var(--text);
		background: var(--surface-sunken);
		font-weight: 600;
	}
</style>
