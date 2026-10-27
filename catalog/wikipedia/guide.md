## Try Wikipedia

No setup at all — the server reads public Wikipedia APIs, no credentials. This is the most widely used community Wikipedia server.

Ask the agent to `search_wikipedia` for a topic, then pull `get_summary` for the short version or `get_article` for the full text, extract `extract_key_facts`, or wander with `get_related_topics`. Everything is read-only against public data, so this is an easy first server for a P2P session. The server also registers `wikipedia_`-prefixed aliases for each tool; they behave identically.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
