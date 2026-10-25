## Try Figma

Set `FIGMA_API_KEY` in the host environment before running the generated command. The server reads this variable directly, so a key does not need to appear in command-line arguments. `--stdio` selects the transport MCPWire supports.

Ask the agent to inspect a test design using `get_figma_data` and a file or node the token can read. The response should contain design context. Review image-download paths before using `download_figma_images`, which can write assets to the host.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
