## Try Cloudflare

Create an API token with Account: Read plus the resource scopes you intend to share, and set both `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the host environment. Prefer a token limited to the account and permission set you are comfortable exposing.

Ask the agent to list Workers with `worker_list` and inspect one with `worker_get`, or to read KV with `kv_list` and `kv_get`. Stored values, script contents, and R2 objects flow to the guest while the session is open. The official server registers 150+ tools — every deploy and delete tool (`worker_deploy`, `worker_put`, `kv_put`, `d1_delete_database`, `version_rollback`, and more) stays outside the default allowlist, and `d1_query` is excluded too because its SQL can write.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
