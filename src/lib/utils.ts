import { BotContext, AdminInfo } from '../types';
import { getTelegramClient } from './telegram';
import { Database } from './db';

export async function isAdmin(ctx: BotContext, userId?: number): Promise<boolean> {
  if (ctx.isPrivate) return true;
  const targetId = userId ?? ctx.userId;
  if (!targetId) return false;

  const superAdmins = ctx.env.SUPER_ADMINS?.split(',').map(id => parseInt(id.trim())) || [];
  if (superAdmins.includes(targetId)) return true;

  const client = getTelegramClient(ctx.env.BOT_TOKEN);
  try {
    const member = await client.getChatMember(ctx.chatId, targetId);
    return ['creator', 'administrator'].includes(member.status);
  } catch {
    return false;
  }
}

export async function getAdminInfo(ctx: BotContext, userId: number): Promise<AdminInfo | null> {
  const client = getTelegramClient(ctx.env.BOT_TOKEN);
  try {
    const member = await client.getChatMember(ctx.chatId, userId);
    if (!['creator', 'administrator'].includes(member.status)) return null;
    return {
      userId,
      status: member.status as 'creator' | 'administrator',
      customTitle: member.custom_title,
      canDeleteMessages: member.can_delete_messages ?? false,
      canRestrictMembers: member.can_restrict_members ?? false,
      canPromoteMembers: member.can_promote_members ?? false,
      canChangeInfo: member.can_change_info ?? false,
      canPinMessages: member.can_pin_messages ?? false,
    };
  } catch {
    return null;
  }
}

export async function sendReply(ctx: BotContext, text: string, options: any = {}) {
  const client = getTelegramClient(ctx.env.BOT_TOKEN);
  return client.sendMessage(ctx.chatId, text, {
    reply_to_message_id: ctx.message?.message_id,
    ...options
  });
}
