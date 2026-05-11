import { Router } from '../lib/router';
import { sendReply, isAdmin } from '../lib/utils';
import { getTelegramClient } from '../lib/telegram';

export function setupWelcome(router: Router) {
  router.use(async (ctx, next) => {
    // Handle new chat members
    if (ctx.message?.new_chat_members) {
      const client = getTelegramClient(ctx.env.BOT_TOKEN);
      for (const member of ctx.message.new_chat_members) {
        if (member.id === (await client.getMe()).id) {
          await client.sendMessage(ctx.chatId, "Hello! I am your Group Manager Bot. Promote me to admin to unlock all features.");
          continue;
        }

        // Get welcome settings
        const row: any = await ctx.env.DB.prepare('SELECT * FROM welcome_settings WHERE chat_id = ?').bind(ctx.chatId).first();
        if (row && row.welcome_enabled) {
          const msg = row.welcome_msg || `Welcome {first_name} to the group!`;
          const formattedMsg = msg
            .replace('{first_name}', member.first_name)
            .replace('{id}', String(member.id))
            .replace('{username}', member.username ? `@${member.username}` : member.first_name);

          if (row.welcome_file_id) {
             await client.sendNote(ctx.chatId, formattedMsg, row.welcome_file_id, row.welcome_file_type);
          } else {
             await client.sendMessage(ctx.chatId, formattedMsg);
          }
        }
      }
    }

    // Handle left chat members
    if (ctx.message?.left_chat_member) {
      // Get goodbye settings
      const row: any = await ctx.env.DB.prepare('SELECT * FROM welcome_settings WHERE chat_id = ?').bind(ctx.chatId).first();
      if (row && row.goodbye_enabled) {
        const msg = row.goodbye_msg || `Goodbye {first_name}!`;
        const member = ctx.message.left_chat_member;
        const formattedMsg = msg
          .replace('{first_name}', member.first_name)
          .replace('{id}', String(member.id))
          .replace('{username}', member.username ? `@${member.username}` : member.first_name);

        const client = getTelegramClient(ctx.env.BOT_TOKEN);
        if (row.goodbye_file_id) {
            await client.sendNote(ctx.chatId, formattedMsg, row.goodbye_file_id, row.goodbye_file_type);
        } else {
            await client.sendMessage(ctx.chatId, formattedMsg);
        }
      }
    }

    await next();
  });

  router.command('welcome', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;
    
    if (ctx.args[0] === 'on' || ctx.args[0] === 'off') {
      const enabled = ctx.args[0] === 'on' ? 1 : 0;
      await ctx.env.DB.prepare(`
        INSERT INTO welcome_settings (chat_id, welcome_enabled) VALUES (?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET welcome_enabled = excluded.welcome_enabled
      `).bind(ctx.chatId, enabled).run();
      await sendReply(ctx, `Welcome messages are now ${enabled ? 'enabled' : 'disabled'}.`);
    } else {
      await sendReply(ctx, "Usage: `/welcome on` or `/welcome off`", { parse_mode: 'Markdown' });
    }
  });

  router.command('setwelcome', async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const reply = ctx.message?.reply_to_message;
    const text = reply ? (reply.text || reply.caption) : ctx.args.join(' ');

    if (!text && !reply) {
      await sendReply(ctx, "Reply to a message or provide text to set the welcome message. You can use `{first_name}` and `{id}`.");
      return;
    }

    let fileId = null;
    let fileType = null;
    if (reply) {
      if (reply.photo) { fileId = reply.photo[reply.photo.length - 1].file_id; fileType = 'photo'; }
      else if (reply.video) { fileId = reply.video.file_id; fileType = 'video'; }
      else if (reply.document) { fileId = reply.document.file_id; fileType = 'document'; }
    }

    await ctx.env.DB.prepare(`
      INSERT INTO welcome_settings (chat_id, welcome_msg, welcome_file_id, welcome_file_type) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET 
        welcome_msg = excluded.welcome_msg,
        welcome_file_id = excluded.welcome_file_id,
        welcome_file_type = excluded.welcome_file_type
    `).bind(ctx.chatId, text || null, fileId, fileType).run();

    await sendReply(ctx, "Welcome message updated.");
  });
}
