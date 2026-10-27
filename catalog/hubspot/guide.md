## Try HubSpot

Create a HubSpot private app with scopes covering only the objects you intend to share, and set `PRIVATE_APP_ACCESS_TOKEN` in the host environment. This is HubSpot's official server; the token's scopes are the real boundary, so keep them narrow — contact and company reads are enough for the defaults.

Ask the agent who it acts as with `hubspot-get-user-details`, then search contacts or deals with `hubspot-search-objects`. CRM contents are personal data about real people, and everything the token can see flows to the guest while the session is open. All create and update tools stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
