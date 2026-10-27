## Try Exa

Set `EXA_API_KEY` in the host environment. This is the official server from Exa Labs, and searches meter to your plan.

Ask the agent to search the web with `web_search_exa` or answer a programming question with `get_code_context_exa`. The people-oriented tools (`linkedin_search_exa`, `people_search_exa`) return personal data about individuals, so they stay outside the default allowlist along with crawls and deep research.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
