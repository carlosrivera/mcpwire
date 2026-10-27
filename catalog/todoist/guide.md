## Try Todoist

Generate an app-specific API key in Todoist’s integrations settings and set `TODOIST_API_KEY` in the host environment. Prefer a token tied to a test or temporary workspace when trying this server.

Ask the agent what the token can see with `user-info`, then to summarize the week with `get-overview` or `find-tasks-by-date`. Task contents and comments flow to the guest while the session is open. The server is the official one from Doist and registers more tools than this guide lists — `add-tasks`, `complete-tasks`, and `delete-object` all stay outside the default allowlist, so task changes need your explicit approval.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
