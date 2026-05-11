import type {
  TelegramApiResponse,
  SendMessageOptions,
  ReplyMarkup,
  ChatPermissions,
  ChatMember,
  TelegramChat,
  TelegramMessage,
  TelegramUser,
} from '../types';

// ============================================================
// Telegram API Client - Optimized for Cloudflare Workers
// ============================================================

export class TelegramClient {
  private readonly base: string;
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
  }

  private async call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok && res.status !== 400) {
      throw new Error(`HTTP ${res.status} calling ${method}`);
    }

    const data = await res.json() as TelegramApiResponse<T>;

    if (!data.ok) {
      const err = new TelegramError(data.description ?? 'Unknown error', data.error_code ?? 0, method, data.parameters);
      throw err;
    }

    return data.result as T;
  }

  // ── Messages ─────────────────────────────────────────────

  async sendMessage(
    chatId: number | string,
    text: string,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    return this.call('sendMessage', { chat_id: chatId, text, ...opts });
  }

  async sendPhoto(
    chatId: number | string,
    photo: string,
    caption?: string,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    return this.call('sendPhoto', { chat_id: chatId, photo, caption, ...opts });
  }

  async sendVideo(
    chatId: number | string,
    video: string,
    caption?: string,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    return this.call('sendVideo', { chat_id: chatId, video, caption, ...opts });
  }

  async sendDocument(
    chatId: number | string,
    document: string,
    caption?: string,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    return this.call('sendDocument', { chat_id: chatId, document, caption, ...opts });
  }

  async sendAudio(
    chatId: number | string,
    audio: string,
    caption?: string,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    return this.call('sendAudio', { chat_id: chatId, audio, caption, ...opts });
  }

  async sendSticker(chatId: number | string, sticker: string, opts: SendMessageOptions = {}): Promise<TelegramMessage> {
    return this.call('sendSticker', { chat_id: chatId, sticker, ...opts });
  }

  async sendAnimation(chatId: number | string, animation: string, caption?: string, opts: SendMessageOptions = {}): Promise<TelegramMessage> {
    return this.call('sendAnimation', { chat_id: chatId, animation, caption, ...opts });
  }

  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    opts: { parse_mode?: string; reply_markup?: ReplyMarkup; disable_web_page_preview?: boolean } = {},
  ): Promise<TelegramMessage | boolean> {
    return this.call('editMessageText', { chat_id: chatId, message_id: messageId, text, ...opts });
  }

  async editMessageReplyMarkup(
    chatId: number | string,
    messageId: number,
    replyMarkup: ReplyMarkup,
  ): Promise<TelegramMessage | boolean> {
    return this.call('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    });
  }

  async deleteMessage(chatId: number | string, messageId: number): Promise<boolean> {
    try {
      return await this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
    } catch {
      return false;
    }
  }

  async deleteMessages(chatId: number | string, messageIds: number[]): Promise<boolean> {
    try {
      return await this.call('deleteMessages', { chat_id: chatId, message_ids: messageIds });
    } catch {
      return false;
    }
  }

  async forwardMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
  ): Promise<TelegramMessage> {
    return this.call('forwardMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
    });
  }

  async copyMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    opts: { caption?: string; reply_markup?: ReplyMarkup; parse_mode?: string } = {},
  ): Promise<{ message_id: number }> {
    return this.call('copyMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...opts,
    });
  }

  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false,
  ): Promise<boolean> {
    return this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  }

  // ── Chat Administration ───────────────────────────────────

  async banChatMember(
    chatId: number | string,
    userId: number,
    untilDate?: number,
    revokeMessages = false,
  ): Promise<boolean> {
    return this.call('banChatMember', {
      chat_id: chatId,
      user_id: userId,
      until_date: untilDate,
      revoke_messages: revokeMessages,
    });
  }

  async unbanChatMember(
    chatId: number | string,
    userId: number,
    onlyIfBanned = true,
  ): Promise<boolean> {
    return this.call('unbanChatMember', {
      chat_id: chatId,
      user_id: userId,
      only_if_banned: onlyIfBanned,
    });
  }

  async restrictChatMember(
    chatId: number | string,
    userId: number,
    permissions: ChatPermissions,
    untilDate?: number,
  ): Promise<boolean> {
    return this.call('restrictChatMember', {
      chat_id: chatId,
      user_id: userId,
      permissions,
      until_date: untilDate,
    });
  }

  async promoteChatMember(
    chatId: number | string,
    userId: number,
    permissions: {
      is_anonymous?: boolean;
      can_manage_chat?: boolean;
      can_delete_messages?: boolean;
      can_manage_video_chats?: boolean;
      can_restrict_members?: boolean;
      can_promote_members?: boolean;
      can_change_info?: boolean;
      can_invite_users?: boolean;
      can_post_messages?: boolean;
      can_edit_messages?: boolean;
      can_pin_messages?: boolean;
      can_manage_topics?: boolean;
    },
  ): Promise<boolean> {
    return this.call('promoteChatMember', { chat_id: chatId, user_id: userId, ...permissions });
  }

  async setChatAdministratorCustomTitle(
    chatId: number | string,
    userId: number,
    customTitle: string,
  ): Promise<boolean> {
    return this.call('setChatAdministratorCustomTitle', {
      chat_id: chatId,
      user_id: userId,
      custom_title: customTitle,
    });
  }

  async getChatAdministrators(chatId: number | string): Promise<ChatMember[]> {
    return this.call('getChatAdministrators', { chat_id: chatId });
  }

  async getChatMember(chatId: number | string, userId: number): Promise<ChatMember> {
    return this.call('getChatMember', { chat_id: chatId, user_id: userId });
  }

  async getChat(chatId: number | string): Promise<TelegramChat> {
    return this.call('getChat', { chat_id: chatId });
  }

  async getChatMemberCount(chatId: number | string): Promise<number> {
    return this.call('getChatMemberCount', { chat_id: chatId });
  }

  async setChatPermissions(chatId: number | string, permissions: ChatPermissions): Promise<boolean> {
    return this.call('setChatPermissions', { chat_id: chatId, permissions });
  }

  async exportChatInviteLink(chatId: number | string): Promise<string> {
    return this.call('exportChatInviteLink', { chat_id: chatId });
  }

  async leaveChat(chatId: number | string): Promise<boolean> {
    return this.call('leaveChat', { chat_id: chatId });
  }

  async setChatTitle(chatId: number | string, title: string): Promise<boolean> {
    return this.call('setChatTitle', { chat_id: chatId, title });
  }

  async setChatDescription(chatId: number | string, description: string): Promise<boolean> {
    return this.call('setChatDescription', { chat_id: chatId, description });
  }

  // ── Pinning ───────────────────────────────────────────────

  async pinChatMessage(
    chatId: number | string,
    messageId: number,
    disableNotification = false,
  ): Promise<boolean> {
    return this.call('pinChatMessage', {
      chat_id: chatId,
      message_id: messageId,
      disable_notification: disableNotification,
    });
  }

  async unpinChatMessage(chatId: number | string, messageId?: number): Promise<boolean> {
    return this.call('unpinChatMessage', { chat_id: chatId, message_id: messageId });
  }

  async unpinAllChatMessages(chatId: number | string): Promise<boolean> {
    return this.call('unpinAllChatMessages', { chat_id: chatId });
  }

  // ── Webhook ───────────────────────────────────────────────

  async setWebhook(url: string, secret: string): Promise<boolean> {
    return this.call('setWebhook', {
      url,
      secret_token: secret,
      allowed_updates: [
        'message',
        'edited_message',
        'callback_query',
        'chat_member',
        'my_chat_member',
      ],
      max_connections: 100,
      drop_pending_updates: false,
    });
  }

  async deleteWebhook(): Promise<boolean> {
    return this.call('deleteWebhook', { drop_pending_updates: false });
  }

  async getMe(): Promise<TelegramUser> {
    return this.call('getMe');
  }

  // ── Commands ──────────────────────────────────────────────

  async setMyCommands(commands: { command: string; description: string }[]): Promise<boolean> {
    return this.call('setMyCommands', { commands });
  }

  // ── Mute helpers ──────────────────────────────────────────

  async muteUser(chatId: number | string, userId: number, untilDate?: number): Promise<boolean> {
    return this.restrictChatMember(
      chatId,
      userId,
      {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      untilDate,
    );
  }

  async unmuteUser(chatId: number | string, userId: number): Promise<boolean> {
    return this.restrictChatMember(chatId, userId, {
      can_send_messages: true,
      can_send_audios: true,
      can_send_documents: true,
      can_send_photos: true,
      can_send_videos: true,
      can_send_video_notes: true,
      can_send_voice_notes: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
    });
  }

  // ── sendNote helper (send any media type) ─────────────────

  async sendNote(
    chatId: number | string,
    content: string | undefined,
    fileId: string | undefined,
    fileType: string | undefined,
    opts: SendMessageOptions = {},
  ): Promise<TelegramMessage> {
    if (fileId && fileType) {
      switch (fileType) {
        case 'photo':     return this.sendPhoto(chatId, fileId, content, opts);
        case 'video':     return this.sendVideo(chatId, fileId, content, opts);
        case 'document':  return this.sendDocument(chatId, fileId, content, opts);
        case 'audio':     return this.sendAudio(chatId, fileId, content, opts);
        case 'sticker':   return this.sendSticker(chatId, fileId, opts);
        case 'animation': return this.sendAnimation(chatId, fileId, content, opts);
        default:          return this.sendMessage(chatId, content ?? '📎 File', opts);
      }
    }
    return this.sendMessage(chatId, content ?? '❓ Empty note', opts);
  }
}

// ============================================================
// Custom Error
// ============================================================

export class TelegramError extends Error {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    public readonly code: number,
    public readonly method: string,
    parameters?: { retry_after?: number }
  ) {
    super(message);
    this.name = 'TelegramError';
    this.retryAfter = parameters?.retry_after;
  }

  get isPermission(): boolean {
    return this.code === 400 && this.message.includes("can't");
  }

  get isNotFound(): boolean {
    return this.code === 400 && (
      this.message.includes('chat not found') ||
      this.message.includes('user not found')
    );
  }

  get isBotKicked(): boolean {
    return this.code === 403;
  }

  get isFloodWait(): boolean {
    return this.code === 429;
  }
}

// ============================================================
// Singleton factory
// ============================================================

let _client: TelegramClient | null = null;

export function getTelegramClient(token: string): TelegramClient {
  if (!_client || (_client as any).token !== token) {
    _client = new TelegramClient(token);
  }
  return _client;
}
