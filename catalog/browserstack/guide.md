## Try BrowserStack

Set `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in the host environment. This is the official server from BrowserStack, covering test management, Automate, Percy, and accessibility scanning.

Ask the agent what failed with `listTestRuns` and `getFailureLogs`, or dig into build quality with `fetchBuildInsights` and `fetchRCA`. The server registers about 52 tools; the read side is allowed by default, while live sessions, device runs, and visual scans consume plan minutes and stay outside the allowlist — along with all test-case and run writes.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
