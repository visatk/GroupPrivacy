import { Env } from '../env';
import { ChatSettings, TelegramUser, TelegramChat, WarnSettings } from '../types';

export class Database {
  constructor(private db: D1Database) { }

  async initChat(chat: TelegramChat): Promise<void> {
    await this.db.prepare(`
      INSERT INTO chats (chat_id, title, username, type)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        title = excluded.title,
        username = excluded.username,
        updated_at = unixepoch()
    `).bind(chat.id, chat.title ?? '', chat.username ?? null, chat.type).run();

    await this.db.prepare(`
      INSERT OR IGNORE INTO chat_settings (chat_id) VALUES (?)
    `).bind(chat.id).run();
  }

  async initUser(user: TelegramUser): Promise<void> {
    await this.db.prepare(`
      INSERT INTO users (user_id, first_name, last_name, username, is_bot)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        username = excluded.username,
        updated_at = unixepoch()
    `).bind(user.id, user.first_name, user.last_name ?? null, user.username ?? null, user.is_bot ? 1 : 0).run();
  }

  async getChatSettings(chatId: number): Promise<ChatSettings | null> {
    const res = await this.db.prepare(`SELECT * FROM chat_settings WHERE chat_id = ?`).bind(chatId).first();
    if (!res) return null;
    return {
      floodLimit: res.flood_limit as number,
      floodWindow: res.flood_window as number,
      floodAction: res.flood_action as any,
      floodActionTime: res.flood_action_time as number | undefined,
      antilinkEnabled: Boolean(res.antilink_enabled),
      antilinkAction: res.antilink_action as any,
      antilinkWhitelist: res.antilink_whitelist ? JSON.parse(res.antilink_whitelist as string) : [],
      antiforwardEnabled: Boolean(res.antiforward_enabled),
      antiforwardAction: res.antiforward_action as any,
      antiarabicEnabled: Boolean(res.antiarabic_enabled),
      antiarabicAction: res.antiarabic_action as any,
      antirtlEnabled: Boolean(res.antirtl_enabled),
      antirtlAction: res.antirtl_action as any,
      antibotEnabled: Boolean(res.antibot_enabled),
      locks: JSON.parse(res.locks as string || '{}'),
      logChannelId: res.log_channel_id as number | undefined,
      logEvents: JSON.parse(res.log_events as string || '[]'),
      reportsEnabled: Boolean(res.reports_enabled)
    };
  }

  async getWarnSettings(chatId: number): Promise<WarnSettings> {
    const res = await this.db.prepare(`SELECT * FROM warn_settings WHERE chat_id = ?`).bind(chatId).first();
    if (!res) return { warnLimit: 3, warnMode: 'mute' };
    return {
      warnLimit: res.warn_limit as number,
      warnMode: res.warn_mode as any,
      warnTime: res.warn_time as number | undefined
    };
  }

  async addWarn(chatId: number, userId: number, warnedBy: number, reason?: string): Promise<number> {
    await this.db.prepare(`
      INSERT INTO warnings (chat_id, user_id, warned_by, reason)
      VALUES (?, ?, ?, ?)
    `).bind(chatId, userId, warnedBy, reason ?? null).run();

    const countRes = await this.db.prepare(`
      SELECT COUNT(*) as c FROM warnings WHERE chat_id = ? AND user_id = ?
    `).bind(chatId, userId).first();
    return (countRes?.c as number) || 1;
  }

  async resetWarns(chatId: number, userId: number): Promise<void> {
    await this.db.prepare(`DELETE FROM warnings WHERE chat_id = ? AND user_id = ?`).bind(chatId, userId).run();
  }

  async logAction(chatId: number, userId: number, action: string, targetId?: number, reason?: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO action_logs (chat_id, user_id, action, target_id, reason)
      VALUES (?, ?, ?, ?, ?)
    `).bind(chatId, userId, action, targetId ?? null, reason ?? null).run();
  }
}
