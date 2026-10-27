## Try MotherDuck

Set `MOTHERDUCK_TOKEN` in the host environment to reach MotherDuck cloud databases; without a token the server works on local DuckDB files instead. This is the official server from MotherDuck.

Ask the agent what it can see with `list_databases`, then explore with `list_tables` and `list_columns`. Schema metadata is safe to browse; `execute_query` stays outside the default allowlist because DuckDB SQL can write files on the host and mutate local databases, and `switch_database_connection` can attach new files by path.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
