## Try Jira

Create an Atlassian API token, then set `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, and `ATLASSIAN_API_TOKEN` in the host environment. Use a token whose account only sees the projects you intend to share. This is a community server — Atlassian’s official MCP server is remote-only and not supported by this catalog.

Ask the agent to look up an issue with `jira_get` on a path like `/rest/api/3/issue/PROJ-123`, or to search with `/rest/api/3/search/jql`. Search results include issue fields your token can access. The write tools (`jira_post`, `jira_put`, `jira_patch`, `jira_delete`) stay outside the default allowlist because they act on your Jira data with your identity.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
