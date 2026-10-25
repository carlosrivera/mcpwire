/**
 * Layer-7 JSON-RPC firewall. Runs on the HOST terminal:
 *  - tools/call requests for non-authorized tools never reach the local MCP server.
 *  - tools/list responses are rewritten so the remote peer can't even discover
 *    tools the host did not expose.
 */

export interface Policy {
  /** Explicit whitelist (null = everything not denied). */
  allow: Set<string> | null;
  /** Blacklist — always wins over allow. */
  deny: Set<string>;
  /** Tools approved mid-session via Human-in-the-Loop "Always allow". */
  sessionAllowed: Set<string>;
}

export function parsePolicy(allowArg?: string, denyArg?: string): Policy {
  const split = (s?: string) =>
    s === undefined ? null : new Set(s.split(',').map((t) => t.trim()).filter(Boolean));
  return {
    allow: split(allowArg),
    deny: denyArg ? new Set(denyArg.split(',').map((t) => t.trim()).filter(Boolean)) : new Set(),
    sessionAllowed: new Set(),
  };
}

export function policySummary(policy: Policy): string {
  if (policy.deny.size && policy.allow) {
    return `${policy.allow.size} tools allowed (${[...policy.allow].join(', ')}) — denying: ${[...policy.deny].join(', ')}`;
  }
  if (policy.allow) return `${policy.allow.size} tools allowed (${[...policy.allow].join(', ')})`;
  if (policy.deny.size) return `ALL tools except (${[...policy.deny].join(', ')})`;
  return 'ALL tools (UNRESTRICTED)';
}

export function isCallAllowed(policy: Policy, tool: string): boolean {
  if (policy.deny.has(tool)) return false;
  if (policy.sessionAllowed.has(tool)) return true;
  if (policy.allow) return policy.allow.has(tool);
  return true;
}

export interface ToolDescriptor {
  name: string;
  [key: string]: unknown;
}

export function filterToolList(
  policy: Policy,
  tools: ToolDescriptor[],
): { kept: ToolDescriptor[]; blockedCount: number } {
  const kept = tools.filter((t) => isCallAllowed(policy, t.name));
  return { kept, blockedCount: tools.length - kept.length };
}

export function deniedByHostError(id: unknown, tool: string) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code: -32601,
      message: `[MCPWire Firewall] Tool '${tool}' is not allowed by host.`,
    },
  };
}

export function deniedByHumanError(id: unknown, tool: string) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code: -32000,
      message: `[MCPWire HITL] Host operator denied the call to '${tool}'.`,
    },
  };
}
