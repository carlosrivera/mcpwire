## Try XcodeBuild

The host needs macOS with Xcode installed; there are no credentials. XcodeBuildMCP is maintained under Sentry's GitHub org and drives local simulators through xcodebuild — this catalog's launch pins its `mcp` subcommand.

Ask the agent to find your project with `discover_projs`, read `list_schemes`, then build with `build_sim` and capture `screenshot` or `snapshot_ui`. Inspecting, building, and reading coverage is safe to delegate; launching apps, running the test suite, and cleaning stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
