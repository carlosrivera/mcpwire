## Try Linear

Create a Linear API key and set `LINEAR_API_KEY` in the host environment. Linear ships an official MCP server, but it is remote-only and outside this catalog's stdio support, so this entry uses the widely used community server.

Ask the agent to look up an issue with `linear_search_issues_by_identifier` (e.g. ENG-123), search by keyword with `linear_search_issues`, or summarize a project with `linear_get_project`. Issues, comments, and project data flow to the guest while the session is open. Every mutating tool — create, edit, bulk update, delete, comments, milestones — stays outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
