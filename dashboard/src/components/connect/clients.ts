/**
 * The setup steps of each AI app on the Connect page, for this instance's MCP address and
 * mode. Commands follow each app's documentation; where a menu label is not certain, the
 * text stays generic ("go to Settings, then Connectors").
 */
import type { Translate } from '../../i18n';
import { t as english } from '../../i18n/en';
import { PLUGIN, type McpConnection } from '../../lib/connect';

export interface ClientStep {
  text: string;
  /** A command or config snippet to copy. */
  code?: string;
}

export interface ConnectClient {
  id: 'claude-code' | 'chatgpt' | 'cursor' | 'claude-desktop' | 'claude-ai';
  name: string;
  /** False when this app cannot reach this instance (web chats and a local address). */
  available: boolean;
  steps: ClientStep[];
  note?: string;
  /** Another way to connect this app, shown under the recommended steps. */
  alternative?: { title: string; steps: ClientStep[]; note?: string };
  /** An optional extra for this app, shown under the steps with a link. */
  extra?: { title: string; text: string; href: string; linkText: string };
}

/** Where the Course companion is explained and set up. */
const COMPANION_DOCS = 'https://github.com/CGSeb/lessonfolk/blob/main/docs/using-lessonfolk.md#the-course-companion-claude-code';

const TOKEN_HEADER = 'Authorization: Bearer <your token>';

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** `t` gives the texts in the visitor's language (English by default). */
export function connectClients(connection: McpConnection, t: Translate = english): ConnectClient[] {
  const { url, mode, tokenRequired, reachableFromWeb, plugin } = connection;
  const oauth = mode === 'oauth';
  // The web-chat answer when this address is not public.
  const unavailable = t(mode === 'none' ? 'connect.notAvailableLocal' : 'connect.notAvailableWeb');

  const companion: ConnectClient['extra'] = {
    title: t('connect.companion.title'),
    text: t('connect.companion.text'),
    href: COMPANION_DOCS,
    linkText: t('connect.companion.link'),
  };

  // The learner plugin (skills, Course companion and this server): only on the instance it
  // connects to. Everywhere else, the manual setup for this instance's own address.
  const pluginSteps = (intro: string, check: string): ClientStep[] => [
    { text: intro, code: `claude plugin marketplace add ${PLUGIN.marketplace}` },
    { text: t('connect.plugin.install'), code: `claude plugin install ${PLUGIN.id}` },
    { text: check },
  ];

  const claudeCodeManual: ClientStep[] = [
    {
      text: t('connect.claudeCode.add'),
      code: `claude mcp add --transport http lessonfolk ${url}${tokenRequired ? ` --header "${TOKEN_HEADER}"` : ''}`,
    },
    { text: t(oauth ? 'connect.claudeCode.checkOauth' : 'connect.claudeCode.checkNone') },
  ];

  const claudeCode: ConnectClient = plugin
    ? {
        id: 'claude-code',
        name: 'Claude Code',
        available: true,
        steps: pluginSteps(t('connect.plugin.claudeCode'), t('connect.plugin.claudeCodeCheck')),
        alternative: { title: t('connect.plugin.manualTitle'), steps: claudeCodeManual, note: t('connect.plugin.manualNote') },
      }
    : { id: 'claude-code', name: 'Claude Code', available: true, steps: claudeCodeManual, extra: companion };

  // The ChatGPT desktop app and chatgpt.com: the same Plugins page, where a custom MCP server is added.
  const chatgpt: ConnectClient = {
    id: 'chatgpt',
    name: 'ChatGPT',
    available: true,
    steps: [
      { text: t('connect.chatgptApp.add') },
      { text: t(oauth ? 'connect.chatgptApp.fillOauth' : 'connect.chatgptApp.fillNone'), code: url },
      { text: t(oauth ? 'connect.chatgptApp.createOauth' : 'connect.chatgptApp.createNone') },
    ],
    note: tokenRequired ? t('connect.chatgptApp.tokenNote') : undefined,
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
  const connectorSteps: ClientStep[] = [{ text: t('connect.claudeDesktop.connector'), code: url }];
  const claudeDesktop: ConnectClient = plugin
    ? {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        available: true,
        steps: pluginSteps(t('connect.plugin.claudeDesktop'), t('connect.plugin.claudeDesktopCheck')),
        alternative: {
          title: t('connect.plugin.connectorTitle'),
          steps: connectorSteps,
          note: t('connect.claudeDesktop.connectorNote'),
        },
      }
    : reachableFromWeb
    ? {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        available: true,
        steps: connectorSteps,
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

  return [claudeCode, chatgpt, cursor, claudeDesktop, claudeAi];
}
