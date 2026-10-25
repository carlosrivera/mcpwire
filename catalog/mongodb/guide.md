## Try MongoDB

Set the host connection string to a development database using a database user with restricted permissions. Keep the server’s `--readOnly` flag.

Ask the agent to inspect `list-connections`, then list accessible databases and collections. Private documents are not exposed by the default inventory allowlist. Database permissions remain important even with server read-only mode enabled.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
