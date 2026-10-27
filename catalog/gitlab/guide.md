## Try GitLab

Create a personal access token with `read_api` scope (add more only if you plan to approve writes) and set `GITLAB_PERSONAL_ACCESS_TOKEN` in the host environment. For self-managed GitLab, also set `GITLAB_API_URL`. This is the community server from zereight — GitLab ships an official MCP server, but it is remote-only and outside this catalog's stdio support.

The server starts with a 40-tool core set, and the default allowlist covers the read side of it. Ask the agent who it is with `whoami`, then read a file with `get_file_contents`, review a merge request with `get_merge_request_diffs`, or dig into an issue with `get_issue`. Writes that are in the core set (`create_issue`, `create_merge_request`, `update_merge_request`, `create_issue_note`) stay outside the allowlist. `discover_tools` lets a session activate extra toolsets; newly activated tools then require approval like everything else.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
