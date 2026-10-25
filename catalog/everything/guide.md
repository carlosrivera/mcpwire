## Try Everything (Test Server)

This is a protocol test server, not a production data integration. Its resources and prompts are separate from its tool interface.

Ask the agent to call `echo` with a short test message. The result should contain that message. Environment inspection and file-reading demonstration tools stay outside the default allowlist; non-tool MCP methods are not filtered by that allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
