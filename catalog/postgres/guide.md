## Try PostgreSQL

Use a local or non-production PostgreSQL database with a restricted read-only role. Replace the connection URL with the host’s database URL; avoid putting production credentials in shell history.

Ask the agent to use `query` to run `SELECT 42 AS answer`. The result should contain `42`. MCPWire filters the tool name and does not inspect the SQL. The reference server is archived; keep database permissions restrictive.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
