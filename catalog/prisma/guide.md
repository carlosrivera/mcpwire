## Try Prisma

No catalog-side setup — the server is Prisma's official CLI in its `mcp` mode and reads whatever Prisma project the host launches it from, including the `DATABASE_URL` in that project's environment. Launch the share command from your project root.

Ask the agent for `migrate-status` to see whether the database is in sync with the schema. `migrate-dev` (which writes migrations and changes the database) and `Prisma-Studio` (which exposes database contents) stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
