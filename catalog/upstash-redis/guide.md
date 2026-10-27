## Try Upstash Redis

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the host environment, from the REST section of your Upstash console. This is the official server from Upstash.

The token is the boundary: with a read-only token, `redis_run_commands` can only read; with a read-write token it can set and delete keys, so the tool is marked for review regardless. Ask the agent to check a key or run a `GET`, and use `redis_search_docs` for Upstash questions. Local Redis instances are covered by the separate Redis guide.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
