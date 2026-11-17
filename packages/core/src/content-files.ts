/**
 * Reading helpers shared by the course and project loaders. Internal: not exported from the
 * package index. Problems are pushed to `issues` instead of thrown.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { formatIssues } from './schemas.ts';

/** A problem found in a content file. */
export interface ContentIssue {
  /** File the problem was found in. */
  file: string;
  message: string;
}

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function readYaml(file: string, issues: ContentIssue[]): unknown {
  try {
    return parseYaml(readFileSync(file, 'utf8'));
  } catch (err) {
    issues.push({ file, message: `cannot parse YAML: ${(err as Error).message.split('\n')[0]}` });
    return undefined;
  }
}

/** Frontmatter data and the Markdown body that follows it. */
export function readMarkdownFile(file: string, issues: ContentIssue[]): { front: unknown; body: string } {
  const text = readFileSync(file, 'utf8');
  const match = FRONTMATTER.exec(text);
  if (!match) {
    issues.push({ file, message: 'missing YAML frontmatter (--- … ---) at the top of the file' });
    return { front: undefined, body: text };
  }
  const body = text.slice(match[0].length);
  try {
    return { front: parseYaml(match[1]), body };
  } catch (err) {
    issues.push({
      file,
      message: `cannot parse frontmatter: ${(err as Error).message.split('\n')[0]}`,
    });
    return { front: undefined, body };
  }
}

export function validate<S extends z.ZodType>(
  schema: S,
  data: unknown,
  file: string,
  issues: ContentIssue[],
): z.output<S> | undefined {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const message of formatIssues(result.error)) issues.push({ file, message });
  return undefined;
}

export function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}
