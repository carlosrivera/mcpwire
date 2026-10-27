## Try Discord

Create a Discord bot, enable the Message Content intent, invite it to the server you want to share, and set `DISCORD_TOKEN` in the host environment (`GUILD_ID` scopes lookups to one server). Discord has no official MCP server, so this entry uses a maintained community server.

Ask the agent to catch up with `discord_get_message_history` or find a decision with `discord_search_messages`. Channel contents flow to the guest while the session is open, so share a bot that can only read the channels you intend. Anything identity-shaped — sending, reacting, friends, presence, DMs — stays outside the default allowlist; run it only with a dedicated bot account, never your personal token.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
