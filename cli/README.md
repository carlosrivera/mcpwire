# MCPWire

Share a local MCP server with a teammate’s AI agent over a Noise-encrypted peer connection. The server runs on your machine; you choose which tools their agent can call and when the session ends.

[Documentation](https://mcpwire.co/docs) · [Server guides](https://mcpwire.co/teleport) · [Command builder](https://mcpwire.co/builder)

## Get started

To see all options and usage:

```bash
npx -y @mcpwire/cli
```

Any package runner works: `pnpm dlx @mcpwire/cli`, `bunx @mcpwire/cli`, or `yarn dlx @mcpwire/cli`.

Both machines need Node.js 18 or newer and an MCP client that supports stdio servers. The filesystem server used in this example requires **Node.js 24 or newer on the host**.

### On your machine

Create a folder with a test file:

```bash
mkdir -p "$HOME/mcpwire-demo"
printf 'Hello from the host.\n' > "$HOME/mcpwire-demo/hello.txt"
```

Share its read and directory-listing tools for 30 minutes:

```bash
npx -y @mcpwire/cli share \
  --name shared-files \
  --allow "read_file,list_directory" \
  --redact-secrets \
  --ttl 30m \
  -- npx -y @modelcontextprotocol/server-filesystem@2.0.1 \
  "$HOME/mcpwire-demo"
```

Keep this terminal running. MCPWire prints a `wire://` ticket and a client configuration snippet. Send them privately to your teammate. Everything after `--` is the command that launches the MCP server on your machine.

### On their machine

Add the printed server entry to the MCP client’s configuration. For example, in Claude Desktop’s `claude_desktop_config.json` or Cursor’s `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shared-files": {
      "command": "npx",
      "args": [
        "-y", "@mcpwire/cli", "join",
        "wire://PASTE_THE_FULL_TICKET_FROM_THE_HOST"
      ]
    }
  }
}
```

Replace the ticket placeholder with the complete ticket. If the client already has an `mcpServers` object, add the entry to it. Reload the client’s MCP configuration. The guest machine doesn’t need npm specifically: `"command": "bunx"` with args `["@mcpwire/cli", "join", "…"]` (Bun), or `"command": "pnpm"` with args `["dlx", "@mcpwire/cli", "join", "…"]` (pnpm) work the same way.

The agent should see `read_file` and `list_directory`. Give it the **absolute path on the host** to the demo folder and ask it to read `hello.txt`. It should return `Hello from the host.` A `write_file` request is blocked.

### End the session

Press Ctrl+C in the host terminal, or let the 30-minute limit expire. Restarting the host creates a new ticket.

For other servers, choose a [server guide](https://mcpwire.co/teleport) or use the [command builder](https://mcpwire.co/builder). Their prerequisites and tool names vary.

### Test without a second device

You don’t need two physical computers or a teammate to test MCPWire end-to-end. You can run the host in a free cloud sandbox (which has its own isolated network and public IP) and connect from your local machine to test real peer discovery and NAT traversal:

* **Google Cloud Shell** ([shell.cloud.google.com](https://shell.cloud.google.com)): Free browser-based Linux terminal with 50 hours/week, Node.js pre-installed, and no credit card required.
  ```bash
  mkdir -p "$HOME/mcpwire-demo"
  printf 'Hello from Cloud Shell!\n' > "$HOME/mcpwire-demo/hello.txt"
  npx -y @mcpwire/cli share \
    --name cloud-files \
    --allow "read_file,list_directory" \
    -- npx -y @modelcontextprotocol/server-filesystem \
    "$HOME/mcpwire-demo"
  ```
* **GitHub Codespaces** ([github.com/codespaces/new](https://github.com/codespaces/new)): Free 60 hours/month with any GitHub account. Open a terminal in any Codespace and run the same share command.

Copy the printed `wire://` ticket, then on your local machine test the connection in your terminal or MCP client:
```bash
npx -y @mcpwire/cli join wire://PASTE_THE_CLOUD_TICKET_HERE
```

## Session controls

Put these flags before `--` in the host command:

| Flag | What it does |
| --- | --- |
| `--allow "tool_a,tool_b"` | Expose only the named tools. `--allow ""` exposes none. |
| `--deny "tool_a"` | Block named tools, including tools also listed in `--allow`. |
| `--redact-secrets` | Replace recognized secrets in outbound responses with `[REDACTED_BY_MCPWIRE]`. |
| `--confirm` | Ask for approval in the host terminal before forwarding an allowed tool call. |
| `--ttl 30m` | End the session after a duration, such as `30m`, `90s`, or `1h30m`. |
| `--max-calls 20` | Limit the total forwarded tool calls across the session’s peers. |
| `--record session.wirelog` | Save local session events for the [replay viewer](https://mcpwire.co/replay). Replaces an existing file at that path. |
| `--name shared-files` | Set the server name in the printed client configuration. |

Without an allowlist, every tool not explicitly denied is available. Redaction and approvals are off by default, and sessions have no expiry or call budget unless you set one.

With `--confirm`, answer `y` to allow a call, `n` to deny it, or `a` to allow that tool without further prompts for the current session. Approval requires an interactive host terminal.

You can also install the CLI globally with `npm install -g @mcpwire/cli`, then run `mcpwire share` or `mcpwire join`. Run `npx -y @mcpwire/cli --help` for usage.

## Understand the access you’re sharing

Connections are direct between the two machines and encrypted end to end with the Noise protocol; tool traffic never passes through MCPWire infrastructure. Peer discovery rides the public Hyperswarm DHT — on networks that block it, set `MCPWIRE_BOOTSTRAP=host:port,...` on both machines to use private bootstrap nodes.

Keep session tickets private. A ticket can be reused while its host session is active. The guest uses the host’s server, environment, and service permissions, so use restricted credentials and share only the tools and data you intend to expose.

The allowlist controls **tool names**. It does not inspect SQL, validate tool arguments, filter MCP resources or prompts, or sandbox the server process. An allowed read tool can still return private data.

Secret redaction matches known patterns and can miss sensitive information. It does not scrub incoming arguments or local logs. Recordings include the ticket, server command, and unredacted argument previews; treat them as sensitive. They contain event and response metadata, not full response bodies.

## Connection problems

Keep the host running and use its current ticket. If joining times out, check network access on both machines; restrictive firewalls or NAT configurations can prevent a connection. If your network blocks the public discovery DHT, run both sides with `MCPWIRE_BOOTSTRAP=host:port,...` pointing at a reachable bootstrap node. If a connection closes immediately, check the host terminal for server startup errors.

Calls are not automatically replayed after a disconnect. Check whether an operation completed before retrying a tool with side effects. See [troubleshooting](https://mcpwire.co/docs#troubleshooting) for more help.

## Contributing

To add a server guide or contribute code, see [CONTRIBUTING.md](https://github.com/carlosrivera/mcpwire/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/carlosrivera/mcpwire/blob/main/LICENSE).
