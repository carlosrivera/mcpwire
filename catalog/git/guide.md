## Try Git

Replace the repository argument with an existing host Git checkout. Relative paths are resolved from the host’s working directory.

Ask the agent to inspect `git_status` and the latest entries with `git_log`. These return the selected checkout’s working-tree state and history. Staging, commit and reset tools are excluded by default; diffs may still contain sensitive code.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
