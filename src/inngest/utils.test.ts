import assert from "node:assert/strict";
import test from "node:test";

import type { AgentResult, Message } from "@inngest/agent-kit";

import {
  lastAssistantTextMessageContent,
  parseAgentOutput,
} from "./utils";

test("parseAgentOutput joins text fields from multipart output", () => {
  const messages: Message[] = [
    {
      type: "text",
      role: "assistant",
      content: [
        { type: "text", text: "hello " },
        { type: "text", text: "world" },
      ],
    },
  ];

  assert.equal(parseAgentOutput(messages), "hello world");
});

test("parseAgentOutput skips non-text messages safely", () => {
  const messages: Message[] = [
    {
      type: "tool_result",
      role: "tool_result",
      tool: { type: "tool", id: "1", name: "read", input: {} },
      content: { unexpected: true },
      stop_reason: "tool",
    },
  ];

  assert.equal(parseAgentOutput(messages), "Fragment");
});

test("lastAssistantTextMessageContent ignores assistant tool calls", () => {
  const result = {
    output: [
      { type: "text", role: "assistant", content: "first" },
      {
        type: "tool_call",
        role: "assistant",
        tools: [],
        stop_reason: "tool",
      },
      {
        type: "text",
        role: "assistant",
        content: [{ type: "text", text: "latest" }],
      },
    ],
  } as unknown as AgentResult;

  assert.equal(lastAssistantTextMessageContent(result), "latest");
});
