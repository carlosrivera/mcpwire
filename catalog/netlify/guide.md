## Try Netlify

Authenticate the host and use a test project. Keep `--verbose`: this exposes individual operations rather than a broad dispatcher that cannot be narrowly filtered.

Ask the agent to inspect projects with `netlify-project-get-projects`. Results should include projects visible to the host identity. Deployments, environment-variable management and project mutations stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
