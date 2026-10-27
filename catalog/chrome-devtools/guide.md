## Try Chrome DevTools

No credentials needed — the server launches and drives a local Chrome. This is the official server from the Chrome DevTools team, and it is the natural pairing for MCPWire: a teammate can debug a bug on your machine as if they were sitting next to you.

Ask the agent to open your dev URL with `navigate_page`, then read `list_console_messages` and `list_network_requests`, capture with `take_screenshot`, or profile with `performance_start_trace` and `lighthouse_audit`. The browser session carries your cookies, so pages the guest opens see you logged in — navigate to your own dev server, not your production admin panel. Page interactions (`click`, `fill`, `handle_dialog`) and `evaluate_script` stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
