import { Router } from '../lib/router';
import { sendReply, isAdmin } from '../lib/utils';
import { getTelegramClient } from '../lib/telegram';

export function setupFilters(router: Router) {
  router.command('filter', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const trigger = ctx.args[0]?.toLowerCase();
    if (!trigger) {
      await sendReply(ctx, "Usage: `/filter <trigger> <reply>` or reply to a message with `/filter <trigger>`", { parse_mode: 'Markdown' });
      return;
    }

    const reply = ctx.message?.reply_to_message;
    let content = null;
    let fileId: string | null = null;
    let fileType: string | null = null;

    if (reply) {
      content = reply.text || reply.caption || null;
      if (reply.photo) {
        fileId = reply.photo[reply.photo.length - 1].file_id;
        fileType = 'photo';
      } else if (reply.video) {
        fileId = reply.video.file_id;
        fileType = 'video';
      } else if (reply.document) {
        fileId = reply.document.file_id;
        fileType = 'document';
      } else if (reply.sticker) {
        fileId = reply.sticker.file_id;
        fileType = 'sticker';
      }
    } else {
      content = ctx.args.slice(1).join(' ');
      if (!content) {
        await sendReply(ctx, "You must provide a reply for the filter.");
        return;
      }
    }

    await ctx.env.DB.prepare(`
      INSERT INTO filters (chat_id, trigger, content, file_id, file_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(chat_id, trigger) DO UPDATE SET
        content = excluded.content,
        file_id = excluded.file_id,
        file_type = excluded.file_type,
        created_by = excluded.created_by
    `).bind(ctx.chatId, trigger, content, fileId, fileType, ctx.userId!).run();

    await sendReply(ctx, `Filter \`${trigger}\` added!`, { parse_mode: 'Markdown' });
  });

  router.command(['stop', 'stopfilter'], async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const trigger = ctx.args[0]?.toLowerCase();
    if (!trigger) return;

    const res = await ctx.env.DB.prepare('DELETE FROM filters WHERE chat_id = ? AND trigger = ?').bind(ctx.chatId, trigger).run();
    if (res.meta.changes > 0) {
      await sendReply(ctx, `Filter \`${trigger}\` stopped.`, { parse_mode: 'Markdown' });
    } else {
      await sendReply(ctx, "Filter not found.");
    }
  });

  router.command('filters', async (ctx, next) => {
    const { results } = await ctx.env.DB.prepare('SELECT trigger FROM filters WHERE chat_id = ?').bind(ctx.chatId).all();
    if (!results || results.length === 0) {
      await sendReply(ctx, "No filters in this chat.");
      return;
    }

    const filterList = results.map(r => `- \`${r.trigger}\``).join('\n');
    await sendReply(ctx, `Filters in this chat:\n${filterList}`, { parse_mode: 'Markdown' });
  });

  // Middleware to check filters on every text message
  router.use(async (ctx, next) => {
    if (ctx.text && ctx.isGroup) {
      const lowerText = ctx.text.toLowerCase();
      // Simple implementation: check if exact match. For real bot, you'd check substrings based on is_regex
      const { results } = await ctx.env.DB.prepare('SELECT * FROM filters WHERE chat_id = ?').bind(ctx.chatId).all();

      if (results && results.length > 0) {
        for (const row of results as any[]) {
          // simple substring match or exact match
          if (lowerText.includes(row.trigger)) {
            const client = getTelegramClient(ctx.env.BOT_TOKEN);
            await client.sendNote(ctx.chatId, row.content, row.file_id, row.file_type, {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: row.parse_mode === 'HTML' ? 'HTML' : undefined
            });
            return; // Trigger only one filter
          }
        }
      }
    }
    await next();
  });
}
