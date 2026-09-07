<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	// Hrefs carry the configured base path (GitHub Pages serves this from a
	// subdirectory) and a trailing slash, which is what the prerendered output
	// is keyed on.
	const links = [
		{ path: '/', label: 'Next workout' },
		{ path: '/progression/', label: 'Progression' },
		{ path: '/methodology/', label: 'Methodology' }
	];

	/** The current route with the base path stripped, always trailing-slashed. */
	function currentPath(): string {
		const path = page.url.pathname.slice(base.length) || '/';
		return path.endsWith('/') ? path : `${path}/`;
	}

	function isActive(path: string): boolean {
		return currentPath() === path;
	}
</script>

<header class="site-header">
	<div class="inner">
		<a class="brand" href="{base}/">
			<span class="mark" aria-hidden="true"></span>
			<span>Top Set</span>
		</a>
		<nav aria-label="Sections">
			{#each links as link (link.path)}
				<a href="{base}{link.path}" aria-current={isActive(link.path) ? 'page' : undefined}>
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
