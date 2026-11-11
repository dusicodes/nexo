import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Server-side only. MCP integration seam: connects nexo to external MCP
 * servers (git forges, feeds, calendars) as stdio subprocesses. Which
 * servers to attach is a later slice; this module is the connection point.
 */

export type McpServerConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

export async function connectMcpServer(
  config: McpServerConfig,
): Promise<Client> {
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args ?? [],
    env: config.env,
  });

  const client = new Client({ name: "nexo", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

export async function listMcpTools(client: Client): Promise<Tool[]> {
  const { tools } = await client.listTools();
  return tools;
}
