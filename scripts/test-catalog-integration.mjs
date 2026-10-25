// Explicit opt-in: this executes the pinned catalog packages. Never part of PR validation.
process.env.MCPWIRE_E2E_RUNS ||= '1';
process.argv.push('--sqlite');
await import('../cli/test/e2e-real.mjs');
