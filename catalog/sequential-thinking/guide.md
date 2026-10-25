## Try Sequential Thinking

This server processes reasoning steps rather than connecting to a database or external service. Keep sensitive data out of the first test.

Ask the agent to submit a short arithmetic reasoning task through `sequentialthinking`. The response should acknowledge the submitted step. This tool does not independently verify that the reasoning is correct.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
