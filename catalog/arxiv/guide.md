## Try arXiv

No credentials needed — the server queries public arXiv endpoints and keeps downloaded papers in its own storage on the host. This is the most widely used community arXiv server.

Ask the agent to find papers with `search_papers`, download one with `download_paper`, then read it with `read_paper` or jump straight to `get_paper_outline` and `read_paper_section`. `semantic_search` and `search_paper_text` work over what has been downloaded. Everything is read-only against public data; topic watches and the index rebuild stay outside the allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
