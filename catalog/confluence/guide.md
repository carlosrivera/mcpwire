## Try Confluence

Use the same Atlassian API token setup as Jira: set `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, and `ATLASSIAN_API_TOKEN` in the host environment. Prefer a token whose account has access only to the spaces you intend to share.

Ask the agent to search pages with `conf_get` on a path like `/wiki/api/v2/pages?space-id=123456` or to fetch a page body with `/wiki/api/v2/pages/{id}/body`. Page content flows to the guest while the session is open, so share spaces that can be read by outsiders. The write tools (`conf_post`, `conf_put`, `conf_patch`, `conf_delete`) stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
