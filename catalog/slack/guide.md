## Try Slack

Restrict the Slack bot’s scopes and channel membership. Set both the bot token and team identifier on the host; this is the archived reference server.

Ask the agent to inspect the available channels with `slack_list_channels`. The response depends on the bot’s access. Channel histories contain workspace data, while posting and reply operations stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
