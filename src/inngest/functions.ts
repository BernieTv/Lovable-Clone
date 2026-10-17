import { Sandbox } from '@e2b/code-interpreter';
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  type Message,
  openai,
  type Tool,
} from '@inngest/agent-kit';
import { z } from 'zod';
import { NonRetriableError } from 'inngest';

import prisma from '@/lib/prisma';
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/prompt';
import { FileCollection } from '@/types';
import { inngest } from './client';
import {
  getSandbox,
  lastAssistantTextMessageContent,
  parseAgentOutput,
} from './utils';
import { SANDBOX_TIMEOUT_IN_MS } from '@/constants';

interface AgentState {
  summary: string;
  files: FileCollection;
  toolInvocationCounts: Record<string, number>;
}

const eventSchema = z.object({
  projectId: z.string().min(1),
  messageId: z.string().min(1),
  userId: z.string().min(1),
  value: z.string().min(1),
});

function asFileCollection(value: unknown): FileCollection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

function nextToolStep(
  name: string,
  network: Tool.Options<AgentState>['network'],
) {
  const invocation = (network.state.data.toolInvocationCounts[name] ?? 0) + 1;
  network.state.data.toolInvocationCounts[name] = invocation;

  return {
    id: `${name}-${invocation}`,
    name: `${name} (${invocation})`,
  };
}

export const codeAgentFunction = inngest.createFunction(
  {
    id: 'code-agent',
    concurrency: {
      limit: 1,
      key: 'event.data.projectId',
    },
  },
  { event: 'code-agent/run' },
  async ({ event, step }) => {
    const eventData = eventSchema.safeParse(event.data);

    if (!eventData.success) {
      throw new NonRetriableError('Invalid code-agent event payload');
    }

    const { messageId, projectId, userId, value } = eventData.data;

    const projectContext = await step.run('load-project-context', async () => {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
      });

      if (!project) {
        throw new NonRetriableError('Project not found or access denied');
      }

      const [messages, latestFragmentMessage] = await Promise.all([
        prisma.message.findMany({
          where: {
            projectId,
            id: { not: messageId },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.message.findFirst({
          where: {
            projectId,
            fragment: { isNot: null },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            fragment: {
              select: { files: true },
            },
          },
        }),
      ]);

      const formattedMessages: Message[] = messages.reverse().map((message) => ({
        type: 'text',
        role: message.role === 'ASSISTANT' ? 'assistant' : 'user',
        content: message.content,
      }));

      return {
        files: asFileCollection(latestFragmentMessage?.fragment?.files),
        messages: formattedMessages,
      };
    });

    const sandboxId = await step.run('get-sandbox-id', async () => {
      const sandbox = await Sandbox.create('vibe-nextjs-bek-2');
      await sandbox.setTimeout(SANDBOX_TIMEOUT_IN_MS);

      for (const [path, content] of Object.entries(projectContext.files)) {
        await sandbox.files.write(path, content);
      }

      return sandbox.sandboxId;
    });

    const state = createState<AgentState>(
      {
        summary: '',
        files: projectContext.files,
        toolInvocationCounts: {},
      },
      {
        messages: projectContext.messages,
      },
    );

    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'An expert coding agent',
      system: PROMPT,
      model: openai({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        baseUrl: process.env.OPENAI_BASE_URL || undefined,
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [
        createTool({
          name: 'terminal',
          description: 'Use the terminal to run commands',
          parameters: z.object({
            command: z.string(),
          }),
          handler: async (
            { command },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            const run = async () => {
              const buffers = {
                stdout: '',
                stderr: '',
              };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (error) {
                console.error(
                  `command failed: ${error}\nstdOut: ${buffers.stdout}\nstdError: ${buffers.stderr}`,
                );
                return `command failed: ${error}\nstdOut: ${buffers.stdout}\nstdError: ${buffers.stderr}`;
              }
            };

            return step
              ? await step.run(nextToolStep('terminal', network), run)
              : await run();
          },
        }),
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or update files in the sandbox',
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            const run = async () => {
              try {
                const updatedFiles = { ...network.state.data.files };
                const sandbox = await getSandbox(sandboxId);

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }

                return updatedFiles;
              } catch (error) {
                return 'Error: ' + error;
              }
            };

            const newFiles = step
              ? await step.run(nextToolStep('createOrUpdateFiles', network), run)
              : await run();

            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: 'readFiles',
          description: 'Read files from the sandbox',
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            const run = async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                return 'Error: ' + error;
              }
            };

            return step
              ? await step.run(nextToolStep('readFiles', network), run)
              : await run();
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes('<task_summary>')) {
              network.state.data.summary = lastAssistantTextMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: 'coding-agent-network',
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(value, { state });

    const fragmentTitleGenerator = createAgent({
      name: 'fragment-title-generator',
      description: 'A fragment title generator',
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        baseUrl: process.env.OPENAI_BASE_URL || undefined,
        defaultParameters: {
          temperature: 0.1,
        },
      }),
    });

    const responseGenerator = createAgent({
      name: 'response-generator',
      description: 'A response generator',
      system: RESPONSE_PROMPT,
      model: openai({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        baseUrl: process.env.OPENAI_BASE_URL || undefined,
        defaultParameters: {
          temperature: 0.1,
        },
      }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );

    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary,
    );

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run('save-result', async () => {
      const ownedProject = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
      });

      if (!ownedProject) {
        throw new NonRetriableError('Project not found or access denied');
      }

      if (isError) {
        return await prisma.message.create({
          data: {
            projectId,
            content: 'Something went wrong. Please try again.',
            role: 'ASSISTANT',
            type: 'ERROR',
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId,
          content: parseAgentOutput(responseOutput),
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: 'Fragment',
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
