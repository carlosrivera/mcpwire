## Try Redis

Point the URL argument at a development Redis instance. Use Redis ACL permissions to restrict commands and key access.

Ask the agent to inspect the database size with `dbsize` or key names with `scan_keys`. The results should reflect the selected Redis database. Value reads, writes and deletions are excluded by default; key names themselves can contain sensitive information.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
