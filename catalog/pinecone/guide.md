## Try Pinecone

Set `PINECONE_API_KEY` in the host environment, from a key scoped to the indexes you want to share. This is the official server from Pinecone.

Ask the agent what it can see with `list-indexes`, then search an index with `search-records` or rerank results with `rerank-documents`. Record contents and metadata flow to the guest while the session is open. `upsert-records` and `create-index-for-model` stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
