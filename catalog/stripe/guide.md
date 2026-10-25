## Try Stripe

Use a restricted Stripe key and a test account for the first session. The host’s permissions determine what the server can access.

Ask the agent to inspect products with `list_products` or prices with `list_prices`. A configured test catalog should return those records. The allowlist does not turn a broad Stripe key into a restricted one; keep payment and refund operations excluded.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
