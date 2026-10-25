## Try Puppeteer

Install a supported browser on the host. This guide uses the archived Puppeteer reference server.

Ask the agent to navigate to a public test page with `puppeteer_navigate`. Review any screenshot tool access before enabling it. Browser navigation itself can cause side effects or expose authenticated sessions; tool-name filtering is not a browser sandbox.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
