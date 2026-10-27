## Try Browserbase

Set `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` in the host environment. This is Browserbase’s official server; sessions run in your cloud project.

Ask the agent to `start` a session, `navigate` to a page, and `extract` its content. Reading is fine to delegate; `act` performs real clicks and form submissions on whatever page is loaded, including pages a guest chooses, so it stays outside the default allowlist. Content from hostile pages is untrusted input for the agent — keep sessions to sites you accept exposing.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
