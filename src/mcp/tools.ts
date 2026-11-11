import { jsonSchema, tool, type JSONSchema7, type ToolSet } from "ai";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Bridges MCP tools into AI SDK tools so a model step (src/ai/agent.ts) can
 * call them. CallToolResult content parts are flattened to text for the
 * model; structured consumers can use client.callTool directly.
 */

export async function mcpToAiTools(client: Client): Promise<ToolSet> {
  const { tools } = await client.listTools();
  const result: ToolSet = {};

  for (const mcpTool of tools) {
    result[mcpTool.name] = tool({
      description: mcpTool.description ?? `MCP tool ${mcpTool.name}`,
      inputSchema: jsonSchema(mcpTool.inputSchema as JSONSchema7),
      execute: async (args) => {
        const call = (await client.callTool(
          {
            name: mcpTool.name,
            arguments: args as Record<string, unknown>,
          },
          CallToolResultSchema,
        )) as CallToolResult;
        return call.content
          .map((part) =>
            part.type === "text" ? part.text : JSON.stringify(part),
          )
          .join("\n");
      },
    });
  }

  return result;
}
