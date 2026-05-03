import { Router } from '../lib/router';
import { sendReply, isAdmin } from '../lib/utils';
import { Database } from '../lib/db';
import { getTelegramClient } from '../lib/telegram';

export function setupNotes(router: Router) {
  router.command('save', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const noteName = ctx.args[0]?.toLowerCase();
    if (!noteName) {
      await sendReply(ctx, "You need to give the note a name. Example: `/save rules`", { parse_mode: 'Markdown' });
      return;
    }

    const reply = ctx.message?.reply_to_message;
    if (!reply) {
      await sendReply(ctx, "You need to reply to a message to save it as a note.");
      return;
    }

    let content = reply.text || reply.caption || null;
    let fileId: string | null = null;
    let fileType: string | null = null;

    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
      fileType = 'photo';
    } else if (reply.video) {
      fileId = reply.video.file_id;
      fileType = 'video';
    } else if (reply.document) {
      fileId = reply.document.file_id;
      fileType = 'document';
    } else if (reply.audio) {
      fileId = reply.audio.file_id;
      fileType = 'audio';
    } else if (reply.sticker) {
      fileId = reply.sticker.file_id;
      fileType = 'sticker';
    } else if (reply.animation) {
      fileId = reply.animation.file_id;
      fileType = 'animation';
    }

    await ctx.env.DB.prepare(`
      INSERT INTO notes (chat_id, name, content, file_id, file_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(chat_id, name) DO UPDATE SET
        content = excluded.content,
        file_id = excluded.file_id,
        file_type = excluded.file_type,
        created_by = excluded.created_by
    `).bind(ctx.chatId, noteName, content, fileId, fileType, ctx.userId!).run();

    await sendReply(ctx, `Saved note \`${noteName}\`. Get it with \`/get ${noteName}\` or \`#${noteName}\``, { parse_mode: 'Markdown' });
  });

  router.command('get', async (ctx, next) => {
    const noteName = ctx.args[0]?.toLowerCase();
    if (!noteName) return;

    await sendNote(ctx, noteName);
  });

  router.command('notes', async (ctx, next) => {
    const { results } = await ctx.env.DB.prepare('SELECT name FROM notes WHERE chat_id = ?').bind(ctx.chatId).all();
    if (!results || results.length === 0) {
      await sendReply(ctx, "There are no notes in this chat.");
      return;
    }

    const noteList = results.map(r => `- \`#${r.name}\``).join('\n');
    await sendReply(ctx, `Notes in this chat:\n${noteList}`, { parse_mode: 'Markdown' });
  });

  router.command('clear', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const noteName = ctx.args[0]?.toLowerCase();
    if (!noteName) return;

    const res = await ctx.env.DB.prepare('DELETE FROM notes WHERE chat_id = ? AND name = ?').bind(ctx.chatId, noteName).run();
    if (res.meta.changes > 0) {
      await sendReply(ctx, `Note \`${noteName}\` deleted.`, { parse_mode: 'Markdown' });
    } else {
      await sendReply(ctx, "Note not found.");
    }
  });

  // Middleware for #hashtag notes
  router.use(async (ctx, next) => {
    if (ctx.text?.startsWith('#')) {
      const noteName = ctx.text.substring(1).split(/\s+/)[0].toLowerCase();
      if (noteName) {
        await sendNote(ctx, noteName);
        return; // Don't call next() if we matched a note
      }
    }
    await next();
  });
}

async function sendNote(ctx: any, noteName: string) {
  const note: any = await ctx.env.DB.prepare('SELECT * FROM notes WHERE chat_id = ? AND name = ?').bind(ctx.chatId, noteName).first();
  if (!note) return;

  const client = getTelegramClient(ctx.env.BOT_TOKEN);
  await client.sendNote(ctx.chatId, note.content, note.file_id, note.file_type, {
    reply_to_message_id: ctx.message?.reply_to_message?.message_id || ctx.message?.message_id,
    parse_mode: note.parse_mode === 'HTML' ? 'HTML' : undefined
  });
}
