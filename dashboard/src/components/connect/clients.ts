/**
 * The setup steps of each AI app on the Connect page, for this instance's MCP address and
 * mode. Commands follow each app's documentation; where a menu label is not certain, the
 * text stays generic ("go to Settings, then Connectors").
 */
import { t } from '../../i18n/en';
import type { McpConnection } from '../../lib/connect';

export interface ClientStep {
  text: string;
  /** A command or config snippet to copy. */
  code?: string;
}

export interface ConnectClient {
  id: 'claude-code' | 'codex' | 'cursor' | 'claude-desktop' | 'claude-ai' | 'chatgpt';
  name: string;
  /** False when this app cannot reach this instance (web chats and a local address). */
  available: boolean;
  steps: ClientStep[];
  note?: string;
  /** An optional extra for this app, shown under the steps with a link. */
  extra?: { title: string; text: string; href: string; linkText: string };
}

/** Where the Course companion is explained and set up. */
const COMPANION_DOCS = 'https://github.com/CGSeb/lessonfolk/blob/main/docs/using-lessonfolk.md#the-course-companion-claude-code';

const TOKEN_HEADER = 'Authorization: Bearer <your token>';

const json = (value: unknown) => JSON.stringify(value, null, 2);

export function connectClients(connection: McpConnection): ConnectClient[] {
  const { url, mode, tokenRequired, reachableFromWeb } = connection;
  const oauth = mode === 'oauth';
  // The web-chat answer when this address is not public.
  const unavailable = t(mode === 'none' ? 'connect.notAvailableLocal' : 'connect.notAvailableWeb');

  const companion: ConnectClient['extra'] = {
    title: t('connect.companion.title'),
    text: t('connect.companion.text'),
    href: COMPANION_DOCS,
    linkText: t('connect.companion.link'),
  };

  const claudeCode: ConnectClient = {
    id: 'claude-code',
    name: 'Claude Code',
    available: true,
    steps: [
      {
        text: t('connect.claudeCode.add'),
        code: `claude mcp add --transport http lessonfolk ${url}${tokenRequired ? ` --header "${TOKEN_HEADER}"` : ''}`,
      },
      { text: t(oauth ? 'connect.claudeCode.checkOauth' : 'connect.claudeCode.checkNone') },
    ],
    extra: companion,
  };

  const codex: ConnectClient = {
    id: 'codex',
    name: 'Codex',
    available: true,
    steps: [
      {
        text: t('connect.codex.add'),
        code: `codex mcp add lessonfolk --url ${url}${tokenRequired ? ' --bearer-token-env-var LESSONFOLK_MCP_TOKEN' : ''}`,
      },
      oauth ? { text: t('connect.codex.checkOauth'), code: 'codex mcp login lessonfolk' } : { text: t('connect.codex.checkNone') },
    ],
    note: tokenRequired ? t('connect.codex.tokenNote') : undefined,
  };

  const cursor: ConnectClient = {
    id: 'cursor',
    name: 'Cursor',
    available: true,
    steps: [
      {
        text: t('connect.cursor.add'),
        code: json({
          mcpServers: { lessonfolk: tokenRequired ? { url, headers: { Authorization: 'Bearer <your token>' } } : { url } },
        }),
      },
      { text: t(oauth ? 'connect.cursor.checkOauth' : 'connect.cursor.checkNone') },
    ],
  };

  // Claude Desktop's custom connectors connect from Anthropic's servers; on a local address,
  // a local bridge in its config file connects from this computer instead.
  const claudeDesktop: ConnectClient = reachableFromWeb
    ? {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        available: true,
        steps: [{ text: t('connect.claudeDesktop.connector'), code: url }],
        note: t('connect.claudeDesktop.connectorNote'),
        extra: companion,
      }
    : {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        available: true,
        steps: [
          {
            text: t('connect.claudeDesktop.local'),
            code: json({ mcpServers: { lessonfolk: { command: 'npx', args: ['-y', 'mcp-remote', url] } } }),
          },
        ],
        note: t('connect.claudeDesktop.localNote'),
        extra: companion,
      };

  const claudeAi: ConnectClient = {
    id: 'claude-ai',
    name: 'claude.ai',
    available: reachableFromWeb,
    steps: reachableFromWeb ? [{ text: t('connect.claudeAi.steps'), code: url }] : [{ text: unavailable }],
  };

  const chatgpt: ConnectClient = {
    id: 'chatgpt',
    name: 'ChatGPT',
    available: reachableFromWeb,
    steps: reachableFromWeb ? [{ text: t('connect.chatgpt.steps') }] : [{ text: unavailable }],
    note: reachableFromWeb ? t('connect.chatgpt.note') : undefined,
  };

  return [claudeCode, codex, cursor, claudeDesktop, claudeAi, chatgpt];
}
