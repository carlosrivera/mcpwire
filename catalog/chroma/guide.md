## Try Chroma

No setup is needed for a local persistent database — the server creates and uses a data directory (pin it with `CHROMA_DATA_DIR`). To share a running Chroma server or Chroma Cloud instead, set `CHROMA_HOST`, `CHROMA_PORT`, and `CHROMA_API_KEY`. This is the official server from Chroma.

Ask the agent what it can see with `chroma_list_collections`, then search with `chroma_query_documents` or read records with `chroma_get_documents`. Document contents flow to the guest while the session is open. All write tools (create, modify, delete, add, update documents) stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
