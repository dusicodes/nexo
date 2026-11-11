import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";

/**
 * Server-side only. The DeepSeek provider seam configured from the
 * environment (see .env.example). No key is ever shipped to the client.
 */

export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

export function getModel(
  opts: { apiKey?: string; model?: string } = {},
): LanguageModel {
  const apiKey = opts.apiKey ?? process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  const deepseek = createDeepSeek({ apiKey });
  return deepseek(
    opts.model ?? process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
  );
}
