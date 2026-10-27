## Try Supabase (Management)

Set `SUPABASE_ACCESS_TOKEN` in the host environment, from a Supabase personal access token. This is Supabase's official Management API server — a different, newer server than the older API reference entry under Supabase.

Ask the agent to list projects with `list_projects`, then inspect a database with `list_tables`, check `get_advisors` for security findings, or generate types with `generate_typescript_types`. Logs and schemas flow to the guest while the session is open. Everything that changes infrastructure — `execute_sql`, `apply_migration`, branch merges, project create/pause — stays outside the default allowlist, and the token's organization scope is the real boundary.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
