## Try Postman

Generate a Postman API key and set `POSTMAN_API_KEY` in the host environment. This is Postman’s official local server; it starts with the minimal toolset, and the `--code`, `--full`, and `--region eu` flags are outside this catalog’s launch.

Ask the agent to list workspaces with `getWorkspaces` and then read a collection with `getCollection`. Collections and environments can embed secrets in variable values, so review what the key can reach before sharing — sessions copy that data to the guest. `runCollection` fires real HTTP requests and stays outside the default allowlist, as do all create and overwrite tools.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
