## Try Google Maps

Enable the relevant Google Maps APIs and restrict the host API key. This guide uses the archived reference server.

Ask the agent to use `maps_geocode` for a public landmark. The result should include coordinates. Requests may incur usage charges and location queries can contain private data; configure API quotas separately.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
