## Try Playwright

Run browser automation against a test page first. Keep personal browser profiles and authenticated sessions separate from shared automation.

Ask the agent to use `browser_navigate` on a public page and inspect its available read tools. Confirm the page context is returned. The selected tools can still navigate or reveal browser content; review the access list rather than treating automation as inherently read-only.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
