/**
 * DLP shield — local secret scrubbing for outbound MCP responses.
 * Runs on the HOST side, before any byte leaves through the P2P tunnel,
 * so a remote peer's LLM never sees raw credentials in tool output.
 */

export interface ScrubResult {
  text: string;
  count: number;
  kinds: string[];
}

const REDACTION = '[REDACTED_BY_MCPWIRE]';

function luhnValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

interface Detector {
  name: string;
  re: RegExp;
  validate?: (match: string) => boolean;
}

// Ordered: high-signal machine credentials first, fuzzy human PII last.
const DETECTORS: Detector[] = [
  { name: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { name: 'openai-key', re: /sk-(?:proj-)?[A-Za-z0-9_-]{16,}/g },
  { name: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{30,}/g },
  { name: 'github-pat', re: /github_pat_[A-Za-z0-9_]{20,}/g },
  { name: 'gitlab-token', re: /glpat-[A-Za-z0-9_-]{20,}/g },
  { name: 'slack-token', re: /xox[baprse]-[A-Za-z0-9-]{10,}/g },
  { name: 'stripe-live-key', re: /s[kr]_live_[A-Za-z0-9]{16,}/g },
  { name: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'google-api-key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'anthropic-key', re: /sk-ant-[A-Za-z0-9_-]{16,}/g },
  { name: 'jwt', re: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  { name: 'bearer', re: /Bearer\s+[A-Za-z0-9\-._~+/]{16,}/gi },
  { name: 'credit-card', re: /\b(?:\d[ -]?){13,19}\b/g, validate: luhnValid },
  // Bound address parts and require a local-part boundary so long file content
  // cannot trigger quadratic backtracking while searching for an @ sign.
  { name: 'email', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}/g },
];

export function scrubSecrets(input: string): ScrubResult {
  let text = input;
  let count = 0;
  const kinds: string[] = [];
  for (const det of DETECTORS) {
    text = text.replace(det.re, (match) => {
      if (det.validate && !det.validate(match)) return match;
      count++;
      if (!kinds.includes(det.name)) kinds.push(det.name);
      return REDACTION;
    });
  }
  return { text, count, kinds };
}

/** Recursively scrub every string inside a parsed JSON-RPC message. */
export function scrubMessage(msg: unknown): ScrubResult {
  let total = 0;
  const kinds: string[] = [];
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') {
      const r = scrubSecrets(node);
      total += r.count;
      for (const k of r.kinds) if (!kinds.includes(k)) kinds.push(k);
      return r.text;
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) out[k] = walk(v);
      return out;
    }
    return node;
  };
  return { text: JSON.stringify(walk(msg)), count: total, kinds };
}
