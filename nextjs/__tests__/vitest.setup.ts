// vitest.setup.ts
import { vi } from 'vitest';

// Mock Next.js server-only package so Vitest doesn't throw resolution errors
vi.mock('server-only', () => ({}));