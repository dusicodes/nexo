import {
  generateText,
  stepCountIs,
  type LanguageModel,
  type ToolSet,
} from "ai";
import { getModel } from "./provider";

/**
 * Minimal assistant seam: a single tool-aware model step. This is the
 * foundation hook the nexo assistant will grow from; it is deliberately not
 * an autonomous product agent yet (no memory, no planning loop, no
 * background execution).
 */

export type AssistantStepOptions = {
  system: string;
  prompt: string;
  tools?: ToolSet;
  model?: LanguageModel;
  maxSteps?: number;
};

export async function runAssistantStep({
  system,
  prompt,
  tools,
  model,
  maxSteps,
}: AssistantStepOptions) {
  return generateText({
    model: model ?? getModel(),
    system,
    prompt,
    tools,
    // Without tools a single step is all that is needed; with tools the
    // model may iterate a few times. Kept small and explicit on purpose.
    stopWhen: stepCountIs(maxSteps ?? (tools ? 5 : 1)),
  });
}
