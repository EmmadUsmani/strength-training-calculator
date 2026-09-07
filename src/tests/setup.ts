import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Vitest runs without globals here, so Testing Library's automatic cleanup
// never registers itself. Unmount between tests explicitly.
afterEach(cleanup);
