## Try Snyk

Run `snyk auth` once on the host (or set `SNYK_TOKEN`) for the scans that need an account; `snyk_code_scan` works statically without one. This is Snyk's official MCP server — their CLI's `mcp` subcommand, which this catalog's launch pins.

Ask the agent to scan the repo with `snyk_code_scan` or `snyk_sca_scan`, audit infrastructure files with `snyk_iac_scan`, or check a package upgrade with `snyk_breakability_check`. Scan findings describe your code's weaknesses — fine for trusted teammates, worth remembering for strangers. `snyk_secret_scan` is excluded from the defaults because its findings can quote secret text, and `snyk_trust`, `snyk_auth`, and `snyk_logout` always need explicit approval.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
