// Fully static site: every route is rendered to HTML at build time and there
// is no server at runtime.
export const prerender = true;

// Emit `progression/index.html` rather than `progression.html`, so a plain
// static host (GitHub Pages included) serves every route without needing a
// rewrite rule.
export const trailingSlash = 'always';
export const ssr = true;
export const csr = true;
