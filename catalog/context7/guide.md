## Try Context7 (Docs)

The host needs network access to Context7. Follow the upstream instructions if your account requires an API key.

Ask the agent to resolve a known library with `resolve-library-id`, then retrieve documentation with `query-docs`. Results should refer to that library. Requests can consume account quota and send your query text to the documentation service.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
