# Catalog schemas

`mcp-server-2025-12-11.schema.json` is an unmodified snapshot of the official MCP Registry server schema:
https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json

Upstream source and MIT license: https://github.com/modelcontextprotocol/registry

`mcpwire.schema.json` defines our versioned catalog policy. MCPWire validates both schemas and applies additional cross-file checks. The supported launch subset is one npm/npx or PyPI/uvx package using stdio and explicit argument values. Registry schema compatibility does not mean an entry is published or its namespace is verified by the official registry.

Schema updates should be deliberate changes with migration and launch regression checks; validation never fetches schemas at build time.
