## Try Time

Install uv so `uvx` is available on the host. No service credentials are needed for this example.

Ask the agent to use `get_current_time` for `UTC`, then `convert_time` between two timezones. Results should include timezone-aware time values. Refer to the server’s argument schema for the accepted date and time fields.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
