import { Router } from '../lib/router';
import { sendReply, isAdmin } from '../lib/utils';
import { Database } from '../lib/db';
import { getTelegramClient } from '../lib/telegram';

export function setupRules(router: Router) {
  router.command('rules', async (ctx, next) => {
    const db = new Database(ctx.env.DB);
    const res = await ctx.env.DB.prepare('SELECT content FROM rules WHERE chat_id = ?').bind(ctx.chatId).first();
    const rules = res?.content as string | undefined;

    if (!rules) {
      await sendReply(ctx, "The admins haven't set any rules for this chat yet.");
      return;
    }

    const client = getTelegramClient(ctx.env.BOT_TOKEN);
    await client.sendMessage(ctx.chatId, rules, { parse_mode: 'HTML' });
  });

  router.command('setrules', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) {
      await sendReply(ctx, "Only admins can set rules.");
      return;
    }

    const rules = ctx.message?.reply_to_message?.text || ctx.args.join(' ');
    if (!rules) {
      await sendReply(ctx, "Please provide the rules or reply to a message to set it as rules.");
      return;
    }

    await ctx.env.DB.prepare(`
      INSERT INTO rules (chat_id, content) VALUES (?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET content = excluded.content, updated_at = unixepoch()
    `).bind(ctx.chatId, rules).run();

    await sendReply(ctx, "Rules have been set successfully!");
  });

  router.command('clearrules', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    await ctx.env.DB.prepare('DELETE FROM rules WHERE chat_id = ?').bind(ctx.chatId).run();
    await sendReply(ctx, "Rules have been cleared.");
  });
}
