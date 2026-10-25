## Try the SQLite example

Install `uv` so that `uvx` is available on the host. Replace `./app.db` in the command above with your database file. The pinned archived SQLite package needs MCP Python SDK v1, so keep `--with 'mcp<2'`.

After connecting the guest, call `read_query` with this argument:

```json
{"query": "SELECT 42 AS revenue, 'root@corp.example.com' AS contact"}
```

The returned row contains revenue `42` and contact `[REDACTED_BY_MCPWIRE]` when response redaction is enabled. The `list_tables` and `describe_table` tools are also enabled by default. A forced `write_query` call is rejected by MCPWire before it reaches the server.

The allowlist controls tool names. It does not parse SQL or make a database read-only. Use database permissions or a server with enforced read-only behavior for sensitive databases. This example checks the SELECT result; it does not establish that arbitrary SQL is harmless.

See [the CLI reference](/docs/#sqlite) for the complete sharing and guest setup.
