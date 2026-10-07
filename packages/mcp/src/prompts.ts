/**
 * The tutor procedures, served as the server `instructions` and the `learn`, `review` and
 * `progress` prompts. The text lives in packages/mcp/prompts/*.md (the single source, adapted
 * from AGENTS.md to the MCP tools). The files are imported as text (`?raw`), so the dashboard
 * build bundles them: the running server never reads them from disk.
 */
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import instructionsText from '../prompts/instructions.md?raw';
import learnText from '../prompts/learn.md?raw';
import progressText from '../prompts/progress.md?raw';
import reviewText from '../prompts/review.md?raw';

const clean = (text: string) => text.replace(/^﻿/, '').replace(/\r\n/g, '\n').trim();

/** The server instructions: tutor role, style and saving rules. They must stand alone, since clients may ignore the prompts. */
export const INSTRUCTIONS = clean(instructionsText);

export interface TutorPrompt {
  name: 'learn' | 'review' | 'progress';
  title: string;
  description: string;
  /** The procedure (prompts/<name>.md). */
  text: string;
}

export const PROMPTS: readonly TutorPrompt[] = [
  {
    name: 'learn',
    title: 'Learn',
    description:
      'Start or continue learning AI: onboarding, optional level check, a personal path, then the next lesson taught step by step. ' +
      'Also: recommend a path, change my level, update my interests, skip a lesson.',
    text: clean(learnText),
  },
  {
    name: 'review',
    title: 'Review',
    description: 'Quiz me on the lessons I have done, focusing on my weak spots.',
    text: clean(reviewText),
  },
  {
    name: 'progress',
    title: 'Progress',
    description: 'Where am I? My progress per course, and the courses and themes I can learn.',
    text: clean(progressText),
  },
];

/**
 * The prompt message: the procedure, what the learner asked (if anything), then the server
 * instructions, so a client that drops the instructions still gets every rule.
 */
export function promptText(prompt: TutorPrompt, request?: string): string {
  const asked = request?.trim();
  return [prompt.text, asked && `The learner asks: ${asked}`, `## Tutor rules\n\n${INSTRUCTIONS}`].filter(Boolean).join('\n\n');
}

export function registerPrompts(server: McpServer): void {
  for (const prompt of PROMPTS) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        argsSchema: z.object({
          request: z.string().optional().describe('What the learner wants, in their words (optional), e.g. "recommend a path".'),
        }),
      },
      ({ request }) => ({
        description: prompt.description,
        messages: [{ role: 'user', content: { type: 'text', text: promptText(prompt, request) } }],
      }),
    );
  }
}
