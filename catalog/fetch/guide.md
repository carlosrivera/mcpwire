## Try Fetch

The host needs outbound network access. Choose public URLs for your first test and avoid internal endpoints or pages containing credentials.

Ask the agent to use `fetch` on a public documentation URL. The result should contain retrieved page content. Fetching untrusted pages can return hostile instructions; network and resource access remain the server’s responsibility.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
