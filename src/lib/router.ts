import { TelegramUpdate, BotContext, TelegramMessage, TelegramCallbackQuery, TelegramChat, TelegramUser } from '../types';
import { Env } from '../env';
import { Database } from './db';
import { getTelegramClient } from './telegram';

export type Middleware = (ctx: BotContext, next: () => Promise<void>) => Promise<void>;

export class Router {
  private middlewares: Middleware[] = [];
  private commandHandlers: Map<string, Middleware[]> = new Map();
  private callbackHandlers: Map<RegExp, Middleware[]> = new Map();

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  command(cmd: string | string[], ...middlewares: Middleware[]) {
    const cmds = Array.isArray(cmd) ? cmd : [cmd];
    for (const c of cmds) {
      this.commandHandlers.set(c.toLowerCase(), middlewares);
    }
  }

  action(regex: RegExp, ...middlewares: Middleware[]) {
    this.callbackHandlers.set(regex, middlewares);
  }

  async handle(update: TelegramUpdate, env: Env): Promise<void> {
    const message = update.message || update.edited_message;
    const callbackQuery = update.callback_query;
    
    let chat: TelegramChat | undefined;
    let fromUser: TelegramUser | undefined;
    let text = '';
    let args: string[] = [];
    let command: string | undefined;

    if (message) {
      chat = message.chat;
      fromUser = message.from;
      text = message.text || message.caption || '';
    } else if (callbackQuery) {
      if (callbackQuery.message) chat = callbackQuery.message.chat;
      fromUser = callbackQuery.from;
    } else if (update.my_chat_member) {
      chat = update.my_chat_member.chat;
      fromUser = update.my_chat_member.from;
    } else if (update.chat_member) {
      chat = update.chat_member.chat;
      fromUser = update.chat_member.from;
    }

    if (!chat) return;

    if (text.startsWith('/')) {
      const parts = text.split(/\s+/);
      let cmdPart = parts[0].substring(1).toLowerCase();
      // Remove bot username if present (e.g., /start@BotUsername)
      if (cmdPart.includes('@')) {
        const [c, u] = cmdPart.split('@');
        if (u.toLowerCase() === env.BOT_USERNAME?.toLowerCase()) {
          cmdPart = c;
        } else {
          // Command meant for another bot
          cmdPart = '';
        }
      }
      if (cmdPart) {
        command = cmdPart;
        args = parts.slice(1);
      }
    }

    const ctx: BotContext = {
      update,
      message,
      callbackQuery,
      chatId: chat.id,
      userId: fromUser?.id,
      fromUser,
      chat,
      text,
      args,
      command,
      env,
      isGroup: chat.type === 'group' || chat.type === 'supergroup',
      isPrivate: chat.type === 'private',
      isSupergroup: chat.type === 'supergroup',
    };

    // Build middleware chain
    const chain: Middleware[] = [...this.middlewares];

    if (command && this.commandHandlers.has(command)) {
      chain.push(...this.commandHandlers.get(command)!);
    }

    if (callbackQuery && callbackQuery.data) {
      for (const [regex, handlers] of this.callbackHandlers.entries()) {
        if (regex.test(callbackQuery.data)) {
          chain.push(...handlers);
          break;
        }
      }
    }

    let index = -1;
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const handler = chain[i];
      if (handler) {
        await handler(ctx, () => dispatch(i + 1));
      }
    };

    await dispatch(0);
  }
}
