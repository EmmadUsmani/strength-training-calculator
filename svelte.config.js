import adapter from '@sveltejs/adapter-static';

/**
 * GitHub Pages serves a project site from /<repo>, so the app has to be built
 * with that prefix. The workflow sets BASE_PATH; local builds and dev stay at
 * the root.
 */
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		// Fully static output: every route is prerendered to HTML at build time.
		adapter: adapter({ fallback: undefined, strict: true }),
		paths: { base }
	}
};

export default config;
