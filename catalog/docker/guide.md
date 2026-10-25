## Try Docker

Run a Docker daemon that the host can access. Prefer an isolated development Docker context; the daemon can control host workloads.

Ask the agent to list containers using `list_containers`. The result should describe accessible containers. Container configuration and logs may reveal secrets even when create, exec and removal operations are excluded.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
