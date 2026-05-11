import { Router } from '../lib/router';
import { getTelegramClient } from '../lib/telegram';
import { isAdmin, sendReply } from '../lib/utils';
import { Database } from '../lib/db';

export function setupAdmin(router: Router) {
  router.command(['ban', 'unban', 'mute', 'unmute', 'kick'], async (ctx, next) => {
    if (!ctx.isGroup) {
      await sendReply(ctx, "This command can only be used in groups.");
      return;
    }

    if (!(await isAdmin(ctx))) {
      await sendReply(ctx, "You don't have administrative permissions.");
      return;
    }

    if (!ctx.message?.reply_to_message) {
      await sendReply(ctx, "Reply to a user's message to use this command.");
      return;
    }

    const targetUser = ctx.message.reply_to_message.from;
    if (!targetUser) return;

    if (await isAdmin(ctx, targetUser.id)) {
      await sendReply(ctx, "I cannot perform this action on an administrator.");
      return;
    }

    const client = getTelegramClient(ctx.env.BOT_TOKEN);
    const db = new Database(ctx.env.DB);
    const reason = ctx.args.join(' ');

    try {
      if (ctx.command === 'ban') {
        await client.banChatMember(ctx.chatId, targetUser.id);
        await sendReply(ctx, `Banned [${targetUser.first_name}](tg://user?id=${targetUser.id})!`, { parse_mode: 'Markdown' });
        await db.logAction(ctx.chatId, ctx.userId!, 'ban', targetUser.id, reason);
      } else if (ctx.command === 'unban') {
        await client.unbanChatMember(ctx.chatId, targetUser.id);
        await sendReply(ctx, `Unbanned [${targetUser.first_name}](tg://user?id=${targetUser.id})!`, { parse_mode: 'Markdown' });
        await db.logAction(ctx.chatId, ctx.userId!, 'unban', targetUser.id, reason);
      } else if (ctx.command === 'mute') {
        await client.muteUser(ctx.chatId, targetUser.id);
        await sendReply(ctx, `Muted [${targetUser.first_name}](tg://user?id=${targetUser.id})!`, { parse_mode: 'Markdown' });
        await db.logAction(ctx.chatId, ctx.userId!, 'mute', targetUser.id, reason);
      } else if (ctx.command === 'unmute') {
        await client.unmuteUser(ctx.chatId, targetUser.id);
        await sendReply(ctx, `Unmuted [${targetUser.first_name}](tg://user?id=${targetUser.id})!`, { parse_mode: 'Markdown' });
        await db.logAction(ctx.chatId, ctx.userId!, 'unmute', targetUser.id, reason);
      } else if (ctx.command === 'kick') {
        await client.banChatMember(ctx.chatId, targetUser.id);
        await client.unbanChatMember(ctx.chatId, targetUser.id);
        await sendReply(ctx, `Kicked [${targetUser.first_name}](tg://user?id=${targetUser.id})!`, { parse_mode: 'Markdown' });
        await db.logAction(ctx.chatId, ctx.userId!, 'kick', targetUser.id, reason);
      }
    } catch (e: any) {
      await sendReply(ctx, `Failed to ${ctx.command}: ${e.message}`);
    }
  });

  router.command(['pin', 'unpin'], async (ctx, next) => {
    if (!ctx.isGroup) return;
    if (!(await isAdmin(ctx))) return;

    const client = getTelegramClient(ctx.env.BOT_TOKEN);
    try {
      if (ctx.command === 'pin') {
        if (!ctx.message?.reply_to_message) {
          await sendReply(ctx, "Reply to a message to pin it.");
          return;
        }
        await client.pinChatMessage(ctx.chatId, ctx.message.reply_to_message.message_id);
        await sendReply(ctx, "Message pinned successfully.");
      } else {
        await client.unpinAllChatMessages(ctx.chatId);
        await sendReply(ctx, "Unpinned all messages.");
      }
    } catch (e: any) {
      await sendReply(ctx, `Action failed: ${e.message}`);
    }
  });
}
