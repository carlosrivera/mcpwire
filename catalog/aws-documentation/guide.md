## Try AWS Documentation

No setup at all — the server reads public AWS documentation and needs no credentials. Set `AWS_DOCUMENTATION_PARTITION` only if you need the `cn` or `us-gov` partitions. This is the official AWS Labs server.

Ask the agent to find a service page with `search_documentation` and read it with `read_documentation` or `read_sections` for long pages. Every tool is read-only against public data, so this is a good first server to try with a teammate.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
