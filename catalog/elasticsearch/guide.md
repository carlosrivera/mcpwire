## Try Elasticsearch

Set `ES_URL` in the host environment plus either `ES_API_KEY` or both `ES_USERNAME` and `ES_PASSWORD`. Create a dedicated API key with read-only privileges on the specific indices you intend to share (the server’s own security guide shows the `POST /_security/api_key` shape). This is Elastic’s official server, currently labeled experimental.

Ask the agent what data is reachable with `list_indices`, then inspect an index with `get_mappings` and run a DSL query with `search`. Searches return actual document contents, so the credential scope — not the allowlist — is what limits disclosure. All four tools are read-only.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
