## Try Obsidian

On the host, install the Obsidian **Local REST API** community plugin, enable it, and copy its API key into `OBSIDIAN_API_KEY`. This is the most widely used community Obsidian server, and it reaches whatever vault the plugin is running on — notes are personal, so pick a vault you are comfortable exposing.

Ask the agent to search the vault with `obsidian_simple_search` or `obsidian_search_by_tag`, then read a note with `obsidian_get_file_contents`. Note contents flow to the guest while the session is open. The write tools (`obsidian_append_content`, `obsidian_patch_content`, `obsidian_put_content`, `obsidian_delete_file`) stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
