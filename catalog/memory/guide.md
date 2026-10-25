## Try Memory (Knowledge Graph)

Start with an empty memory store or a copy of a test knowledge graph. Check the upstream documentation for the storage path configuration.

Ask the agent to use `read_graph` to inspect the graph. An empty store should return an empty graph. Mutation tools are excluded by default, but graph reads may expose every stored entity and relation.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs#connect) for guest configuration and [session controls](/docs#controls) for approvals, redaction, and expiry.
