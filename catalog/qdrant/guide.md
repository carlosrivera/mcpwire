## Try Qdrant

Set `QDRANT_URL` in the host environment (a local instance or Qdrant Cloud), add `QDRANT_API_KEY` if the instance requires one, and set `COLLECTION_NAME` so every lookup hits the same shared collection. The server creates the collection on first use and embeds text locally with fastembed — set `EMBEDDING_MODEL` to match whatever model the collection was written with.

Ask the agent to recall context with `qdrant-find` — results come back as stored memory entries with metadata. `qdrant-store` stays outside the default allowlist because it writes to the shared knowledge base that every teammate’s session reads. The server needs an embedding provider on the host to convert text to vectors; see the upstream README for the supported providers.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
