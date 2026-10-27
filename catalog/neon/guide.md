## Try Neon

Set `NEON_API_KEY` in the host environment, from a Neon API key scoped to the projects you intend to share. This is the official server from Neon.

Ask the agent to list projects with `list_projects`, then explore a branch with `get_database_tables` and `describe_table_schema`. The defaults are read-only, and `explain_sql_statement` can analyze a query without running it. Anything that executes or mutates — `run_sql`, branch create/delete, migrations — stays outside the allowlist, and `get_connection_string` is excluded too because it returns live credentials.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
