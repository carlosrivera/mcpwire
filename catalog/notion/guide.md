## Try Notion

Create a restricted Notion integration and share only test pages with it. The host needs the integration token.

Ask the agent to find a test page with `API-post-search`, then read its properties or blocks using the allowed tools. Results depend on which pages are shared with the integration. Page creation and update operations remain excluded by default.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
