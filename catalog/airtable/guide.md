## Try Airtable

Create a personal access token scoped to just the bases you want to share, and set `AIRTABLE_API_KEY` in the host environment. Airtable tokens can't be restricted per operation — a token that can read a base can also write to it — so the base scope is the real security boundary.

Ask the agent what it can see with `list_bases`, then explore with `list_tables` and `list_records`. Record contents, comments, and schemas flow to the guest while the session is open. All mutating tools (`create_record`, `update_records`, `delete_records`, schema changes, comments) stay outside the default allowlist. This is the most widely used community Airtable server.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
