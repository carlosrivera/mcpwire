# ⚡ MCPWire — P2P Tool Teleportation for AI Agents

> **Share the capability, never the credentials.**

MCPWire teleports a local [MCP](https://modelcontextprotocol.io) server (Postgres, GitHub, Filesystem, Docker…) to a remote teammate's AI agent over an E2EE peer-to-peer Noise tunnel — with a layer-7 JSON-RPC firewall, real-time secret redaction (DLP), human-in-the-loop approval and a self-destruct timer.

**No cloud. No relay servers. No accounts. $0 infrastructure, forever.**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚡ MCPWIRE P2P TELEPORTER v1.0.0 — E2EE NOISE TUNNEL ACTIVE              │
├──────────────────────────────────────────────────────────────────────────┤
│ Status:      🟢 Listening on Distributed Hash Table (Zero-Server P2P)    │
│ Firewall:    🛡️ 3 tools allowed (read_query, list_tables, describe_table)│
│ DLP Shield:  🔒 Secret Scrubbing ON | TTL: 29m 58s remaining             │
└──────────────────────────────────────────────────────────────────────────┘
```

## Repo layout

| Path | What it is |
|---|---|
| [`cli/`](./cli) | The `mcpwire` npm package (TypeScript + hyperswarm). This is the product. |
| [`web/`](./web) | [mcpwire.co](https://mcpwire.co) — static Astro site (builder, SEO pages, wirelog replay). Deploys to GitHub Pages via GitHub Actions. |

## Quick start

**Host** (SQLite example; requires [uv](https://docs.astral.sh/uv/) for `uvx`):

```bash
npx -y @mcpwire/cli share \
  --allow "read_query,list_tables,describe_table" \
  --redact-secrets \
  --ttl 30m \
  -- uvx --with 'mcp<2' mcp-server-sqlite --db-path ./app.db
```

The command prints a `wire://…` ticket and a ready-to-paste `mcpServers` snippet.

**Guest** (your peer, inside `claude_desktop_config.json` / `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "teleported-sqlite": {
      "command": "npx",
      "args": ["-y", "@mcpwire/cli", "join", "wire://7f9a2b8c4e1d0a…"]
    }
  }
}
```

That's it. The peer's agent sees only the 3 whitelisted tools; everything else is filtered out of `tools/list` and blocked if forced. The server runs on your machine. Tool names and their arguments must match that server; MCPWire filters tool names, not SQL statements. The archived SQLite server requires MCP Python SDK v1, hence the `--with` constraint.

## Security model

1. **Tool Whitelisting / Blacklisting** (`--allow`, `--deny`) — the peer's LLM cannot even *discover* non-authorized tools: `tools/list` responses are rewritten on the host before entering the tunnel.
2. **Human-in-the-Loop** (`--confirm`) — every `tools/call` freezes on the wire until you answer `[y/n/a]` in the host terminal.
3. **Ephemeral access** (`--ttl 15m`, `--max-calls 20`) — the tunnel self-destructs mathematically; no dangling access to remember.
4. **Secret Scrubbing / DLP** (`--redact-secrets`) — OpenAI/Anthropic/GitHub/GitLab/Slack/Stripe/AWS/Google keys, JWTs, Bearer headers, emails and Luhn-valid card numbers in tool output are replaced with `[REDACTED_BY_MCPWIRE]` before crossing the tunnel.
5. **Audit** (`--record session.wirelog`) — full flight-recorder trail: every request, response, latency, block and redaction. Replay it in your browser at **[mcpwire.co/replay](https://mcpwire.co/replay)** (the file never leaves your machine — parsing is pure DOM).

The `wire://` ticket is a 256-bit capability token: whoever holds it can connect until the TTL or call budget expires. Treat it like a password.

## CLI reference

```
mcpwire share [flags] -- <command that runs your MCP server>
mcpwire join wire://<ticket>

--allow <list>      Comma-separated tool whitelist
--deny <list>       Comma-separated tool blacklist (wins over --allow)
--redact-secrets    DLP redaction of secrets in responses
--confirm           Approve every tools/call in the host terminal
--ttl <duration>    Self-destruct after 15m / 30s / 1h …
--max-calls <n>     Self-destruct after n tool calls
--record <file>     Write a .wirelog audit trail
--name <name>       Name shown in the generated config snippet
```

Environment: `MCPWIRE_BOOTSTRAP=host:port[,host:port]` points both sides at your own DHT bootstrap nodes (air-gapped labs, CI, corporate networks).

## Development

```bash
# CLI — build + test
cd cli && npm install && npm run build && npm test
# Real SDK/client/server regression: ten cold-start sessions, plus SQLite (needs uvx)
npm run test:e2e:sqlite
# Verify live server initialization and guide allowlists (needs uvx)
npm run test:examples

# Web — dev + build
cd web && npm install && npm run dev       # http://localhost:4321
cd web && npm run build                    # -> dist/ (29 static pages)
npm run check:servers                      # check all example packages against npm/PyPI

# Deploy web: push to main triggers GitHub Pages deployment via GitHub Actions
git push origin main
```

The test suite covers: scrubbing (keys/JWT/email/cards + Luhn false-positive guard), firewall allow/deny semantics, duration parsing, and an end-to-end session through the **real** tunnel code path (`share` firewall + DLP + recorder over a duplex pair against a fake MCP server), plus a full P2P test through hyperswarm when the DHT is reachable.

## How the zero-server trick works

- Discovery: the public [Hyperswarm DHT](https://github.com/holepunchto/hyperswarm) (the network behind Holepunch). The host announces a random 32-byte topic; the guest resolves it; UDP hole punching opens a direct socket.
- Encryption: every connection is encrypted end-to-end with the Noise protocol (Ed25519 keypairs, per-connection keys). Community relays, when hole punching fails, only ever see ciphertext.
- This repo contains **zero server code**. Even if 50,000 developers teleport a database tomorrow, the traffic rides their own laptops — the static site stays $0.00 on Cloudflare Pages.

## License

MIT — see [LICENSE](./LICENSE).

## Connection reliability

The CLI injects HyperDHT **6.32.0** explicitly into Hyperswarm. Releases 6.33–6.34 have a documented [cold-start LAN handshake race](https://github.com/holepunchto/hyperdht/issues/304) that can report a client socket as open while the server never receives it. Keep this pin until a newer release passes `test:e2e` on cold, separate processes. Host tickets are printed after discovery is flushed; join waits for DHT bootstrap and fails after 30 seconds without a host response. Calls are never automatically replayed after disconnection.

An explicit empty `--allow ""` exposes no tools. Omitting `--allow` still permits every tool not denied. The site builder always emits an explicit allowlist, including an empty one.

Run directly via `npx -y @mcpwire/cli` or install globally via `npm install -g @mcpwire/cli`.

To exercise public DHT discovery with the real filesystem server, run `MCPWIRE_E2E_RUNS=1 node cli/test/e2e-real.mjs --public` from the repository root. This tests the public discovery path from one host; a two-machine NAT traversal test is still a separate check.

## Contributing server definitions

All 26 servers live in the shared `catalog/`. Their pinned launch commands, explicit tool defaults, environment requirements, icons, and Markdown guides drive both server guides and the command builder.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the format, schemas, local checks, and reviewed runtime verification. Run `npm ci` at the repository root before building the website to install catalog validation dependencies.
