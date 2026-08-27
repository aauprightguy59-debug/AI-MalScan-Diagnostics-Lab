# Workspace MCP instructions

This workspace includes a TypeScript MCP server at `mcp/aimalscan-server.ts`.

Use the official Model Context Protocol TypeScript SDK:
- SDK repository: https://github.com/modelcontextprotocol/typescript-sdk
- MCP documentation: https://modelcontextprotocol.io/docs
- TypeScript SDK v2 documentation: https://ts.sdk.modelcontextprotocol.io/v2/

The server uses stdio transport and expects the local AI-MalScan app to be running at `http://127.0.0.1:3000`. Configure another app URL with `AIMALSCAN_APP_URL` when needed.
