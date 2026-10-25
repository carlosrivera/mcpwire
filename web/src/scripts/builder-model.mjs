import { shellQuote } from '../../../catalog/normalize.mjs';

export function parseTools(value) {
  const names = [...new Set(value.split(',').map(name => name.trim()).filter(Boolean))];
  if (names.some(name => !/^[A-Za-z0-9_.-]+$/.test(name))) throw new Error('Use tool names with letters, numbers, underscores, dots, or hyphens.');
  return names;
}

export function parseCallLimit(value) {
  if (!value.trim()) return null;
  const limit = Number(value);
  if (!/^[0-9]+$/.test(value.trim()) || !Number.isSafeInteger(limit) || limit < 1) throw new Error('Enter a whole number greater than zero, or leave blank for no limit.');
  return limit;
}

export function buildShareCommand({command, tools, redact, confirm, ttl, maxCalls}) {
  if (!command.trim()) throw new Error('Enter the command that starts your MCP server.');
  const names = parseTools(tools.join(','));
  const limit = parseCallLimit(maxCalls);
  const lines = ['npx -y @mcpwire/cli share', `  --allow ${names.length ? shellQuote(names.join(',')) : '""'}`];
  if (redact) lines.push('  --redact-secrets');
  if (confirm) lines.push('  --confirm');
  if (ttl) lines.push(`  --ttl ${shellQuote(ttl)}`);
  if (limit !== null) lines.push(`  --max-calls ${limit}`);
  lines.push(`  -- ${command.trim()}`);
  return lines.join(' \\\n');
}
