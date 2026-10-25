# Catalog schemas

`mcp-server-2025-12-11.schema.json` is an unmodified snapshot of the official MCP Registry server schema:
https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json

Upstream source: https://github.com/modelcontextprotocol/registry

The upstream MIT license is included in `MCP-REGISTRY-LICENSE`.

`mcpwire.schema.json` defines our versioned catalog policy. MCPWire validates both schemas and applies additional cross-file checks. The supported launch subset is one npm/npx or PyPI/uvx package using stdio, literal/template argument values, standalone named flags, and declarations of inherited host environment variables. Registry schema compatibility does not mean an entry is published or its namespace is verified by the official registry.

Schema updates should be deliberate changes with migration and launch regression checks; validation never fetches schemas at build time.
