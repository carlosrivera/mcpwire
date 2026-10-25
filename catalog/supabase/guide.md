## Try Supabase

Replace the project-reference example with your test project. Keep the server’s `--read-only` flag and use a scoped host token.

Ask the agent to inspect tables with `list_tables` for the configured project. The results should match that project’s visible schemas. SQL and management-operation tools are excluded by default; server read-only mode is a separate control from MCPWire’s allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
