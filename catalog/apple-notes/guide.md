## Try Apple Notes

The host needs macOS with the Notes app signed in — the server drives Notes over AppleScript, no API keys. This is the most feature-rich community Apple Notes server, registering about 89 tools; this guide documents the read side and the main write tools.

Ask the agent to `list-folders`, `search-notes` for a recipe or confirmation number, or read a note with `get-note-markdown`. This is your personal notebook, so the intended use is sharing with your own other machine or someone you trust completely — everything the Notes app can see flows to the guest. All writes (`create-note`, `update-note`, `delete-note`, folders, templates) stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
