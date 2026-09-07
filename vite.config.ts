import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		// Points Vitest at Svelte's client build (and auto-cleans up rendered
		// components). Scoped to test runs so it cannot affect SSR or the build.
		...(process.env.VITEST ? [svelteTesting()] : []),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully static output: every route is prerendered to HTML at build time.
			adapter: adapter({ fallback: undefined, strict: true })
		})
	],
	test: {
		// One jsdom project rather than a node/jsdom split: the domain modules are
		// environment-agnostic, and separate projects end up sharing Vite's module
		// resolution, which resolves `svelte` to its server build and breaks `mount`.
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.ts'],
		include: ['src/**/*.test.ts']
	}
});
