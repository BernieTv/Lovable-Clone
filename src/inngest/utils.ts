import { SANDBOX_TIMEOUT_IN_MS } from "@/constants";
import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, type Message } from "@inngest/agent-kit";

export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_IN_MS); // half hour

  return sandbox;
}

export function lastAssistantTextMessageContent(result: AgentResult) {
  const message = result.output.findLast(
    (candidate) =>
      candidate.type === "text" && candidate.role === "assistant"
  );

  if (!message || message.type !== "text") {
    return undefined;
  }

  return textContent(message.content);
}

export function parseAgentOutput(value: Message[]) {
  const output = value.find((message) => message.type === "text");

  if (!output || output.type !== "text") {
    return "Fragment";
  }

  return textContent(output.content) || "Fragment";
}

function textContent(content: string | Array<{ type: "text"; text: string }>) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        part?.type === "text" && typeof part.text === "string"
    )
    .map((part) => part.text)
    .join("");
}
