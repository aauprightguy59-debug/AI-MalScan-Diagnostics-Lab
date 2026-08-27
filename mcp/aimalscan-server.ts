import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const appUrl = process.env.AIMALSCAN_APP_URL ?? 'http://127.0.0.1:3000';
const server = new McpServer({
  name: 'ai-malscan-diagnostics',
  version: '1.0.0',
});

server.registerTool(
  'check_diagnostics_health',
  {
    description: 'Check whether the local AI-MalScan diagnostics API is running.',
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const response = await fetch(`${appUrl}/api/health`);
      const body = await response.text();
      return {
        content: [{ type: 'text', text: `HTTP ${response.status}: ${body}` }],
        isError: !response.ok,
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Unable to reach ${appUrl}: ${String(error)}` }],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'list_diagnostic_records',
  {
    description: 'List the current in-memory diagnostic records from the local app.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(20),
    }),
  },
  async ({ limit }) => {
    try {
      const response = await fetch(`${appUrl}/api/records`);
      if (!response.ok) {
        return {
          content: [{ type: 'text', text: `The diagnostics API returned HTTP ${response.status}.` }],
          isError: true,
        };
      }

      const records = await response.json() as unknown[];
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(records.slice(0, limit), null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Unable to retrieve diagnostic records: ${String(error)}` }],
        isError: true,
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
