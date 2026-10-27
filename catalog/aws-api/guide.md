## Try AWS API

Configure AWS credentials on the host the usual way (`AWS_PROFILE` or the standard environment chain). This is the official AWS Labs server that executes real AWS CLI commands — which is why this guide starts with **every tool denied**. The share command prints an explicit empty allowlist, and the guest must ask for approval on each call.

A good session flow: let the guest plan with `suggest_aws_commands` (it only suggests), then approve individual `call_aws` invocations you have read. If you want a more open session, re-share with `--allow suggest_aws_commands` and keep `call_aws` on manual approval, or add it for read-only commands you trust. The credentials decide the blast radius — use a scoped role, not an admin key.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
