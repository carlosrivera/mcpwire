## Try GitHub

Use a GitHub token restricted to the repositories and read permissions you intend to share. This guide uses the archived reference server, not GitHub’s newer server.

Ask the agent to search for a public repository using `search_repositories`. Search results should include repository metadata. Write tools such as `push_files` remain outside the default allowlist; reading private repositories still discloses their contents to the guest.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
