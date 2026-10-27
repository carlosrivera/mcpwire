## Try ClickUp

Create a ClickUp personal API token and set `CLICKUP_API_TOKEN` in the host environment. ClickUp has no official stdio server, so this entry uses a maintained community server; the token's workspace scope is the security boundary.

Ask the agent to list workspaces with `get_workspaces`, then read tasks with `get_tasks` or a doc with `get_doc_content`. Task contents, comments, and docs flow to the guest while the session is open. Task, list, and comment writes stay outside the default allowlist; the server registers about 55 tools, and anything not listed here requires explicit approval.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
