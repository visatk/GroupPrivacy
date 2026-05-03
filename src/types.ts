// ============================================================
// Telegram Bot API Types
// ============================================================

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  description?: string;
  invite_link?: string;
  permissions?: ChatPermissions;
}

export interface ChatPermissions {
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  forward_from?: TelegramUser;
  forward_from_chat?: TelegramChat;
  forward_date?: number;
  reply_to_message?: TelegramMessage;
  text?: string;
  entities?: MessageEntity[];
  caption?: string;
  caption_entities?: MessageEntity[];
  photo?: PhotoSize[];
  video?: Video;
  audio?: Audio;
  document?: Document;
  sticker?: Sticker;
  animation?: Animation;
  voice?: Voice;
  video_note?: VideoNote;
  contact?: Contact;
  location?: Location;
  poll?: Poll;
  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  new_chat_title?: string;
  pinned_message?: TelegramMessage;
  message_thread_id?: number;
}

export interface MessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' |
  'email' | 'phone_number' | 'bold' | 'italic' | 'underline' |
  'strikethrough' | 'spoiler' | 'code' | 'pre' | 'text_link' |
  'text_mention' | 'custom_emoji';
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
}

export interface PhotoSize { file_id: string; file_unique_id: string; width: number; height: number; file_size?: number; }
export interface Video { file_id: string; file_unique_id: string; width: number; height: number; duration: number; file_name?: string; }
export interface Audio { file_id: string; file_unique_id: string; duration: number; title?: string; }
export interface Document { file_id: string; file_unique_id: string; file_name?: string; mime_type?: string; }
export interface Sticker { file_id: string; file_unique_id: string; width: number; height: number; is_animated: boolean; }
export interface Animation { file_id: string; file_unique_id: string; width: number; height: number; duration: number; }
export interface Voice { file_id: string; file_unique_id: string; duration: number; }
export interface VideoNote { file_id: string; file_unique_id: string; length: number; duration: number; }
export interface Contact { phone_number: string; first_name: string; user_id?: number; }
export interface Location { latitude: number; longitude: number; }
export interface Poll { id: string; question: string; options: PollOption[]; total_voter_count: number; }
export interface PollOption { text: string; voter_count: number; }

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
}

export interface ChatMember {
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  user: TelegramUser;
  is_anonymous?: boolean;
  custom_title?: string;
  can_be_edited?: boolean;
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
  until_date?: number;
  // For restricted
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
}

export interface ChatMemberUpdated {
  chat: TelegramChat;
  from: TelegramUser;
  date: number;
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
  invite_link?: ChatInviteLink;
}

export interface ChatInviteLink {
  invite_link: string;
  creator: TelegramUser;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  my_chat_member?: ChatMemberUpdated;
  chat_member?: ChatMemberUpdated;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export type ReplyMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove;

// ============================================================
// Bot Domain Types
// ============================================================

export interface BotContext {
  update: TelegramUpdate;
  message?: TelegramMessage;
  callbackQuery?: TelegramCallbackQuery;
  chatId: number;
  userId?: number;
  fromUser?: TelegramUser;
  chat?: TelegramChat;
  text?: string;
  args: string[];
  command?: string;
  env: import('./env').Env;
  isGroup: boolean;
  isPrivate: boolean;
  isSupergroup: boolean;
}

export interface AdminInfo {
  userId: number;
  status: 'creator' | 'administrator';
  customTitle?: string;
  canDeleteMessages: boolean;
  canRestrictMembers: boolean;
  canPromoteMembers: boolean;
  canChangeInfo: boolean;
  canPinMessages: boolean;
}

export interface WarnSettings {
  warnLimit: number;
  warnMode: 'ban' | 'kick' | 'mute';
  warnTime?: number;
}

export interface NoteData {
  id: number;
  chatId: number;
  name: string;
  content?: string;
  fileId?: string;
  fileType?: FileType;
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2';
  buttons?: ButtonRow[][];
  createdBy: number;
}

export interface FilterData {
  id: number;
  chatId: number;
  trigger: string;
  content?: string;
  fileId?: string;
  fileType?: FileType;
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2';
  buttons?: ButtonRow[][];
  isRegex: boolean;
  createdBy: number;
}

export type FileType = 'photo' | 'video' | 'document' | 'audio' | 'sticker' | 'animation' | 'voice';

export interface ButtonRow {
  text: string;
  data?: string;  // callback_data
  url?: string;
}

export interface WelcomeSettings {
  welcomeEnabled: boolean;
  welcomeMsg?: string;
  welcomeFileId?: string;
  welcomeFileType?: FileType;
  welcomeButtons?: ButtonRow[][];
  welcomeParseMode: 'HTML' | 'Markdown';
  welcomeDeleteAfter: number;

  goodbyeEnabled: boolean;
  goodbyeMsg?: string;
  goodbyeFileId?: string;
  goodbyeFileType?: FileType;
  goodbyeButtons?: ButtonRow[][];
  goodbyeParseMode: 'HTML' | 'Markdown';

  captchaEnabled: boolean;
  captchaType: 'button' | 'math' | 'word';
  captchaTimeout: number;
  captchaAction: 'kick' | 'ban' | 'mute';

  cleanService: boolean;
  cleanWelcome: boolean;
}

export interface ChatSettings {
  floodLimit: number;
  floodWindow: number;
  floodAction: 'mute' | 'kick' | 'ban' | 'tban' | 'tmute';
  floodActionTime?: number;

  antilinkEnabled: boolean;
  antilinkAction: 'warn' | 'mute' | 'kick' | 'ban' | 'delete';
  antilinkWhitelist: string[];

  antiforwardEnabled: boolean;
  antiforwardAction: 'warn' | 'delete' | 'kick' | 'ban';

  antiarabicEnabled: boolean;
  antiarabicAction: 'warn' | 'delete' | 'kick' | 'ban' | 'mute';

  antirtlEnabled: boolean;
  antirtlAction: 'warn' | 'delete' | 'kick' | 'ban' | 'mute';

  antibotEnabled: boolean;

  locks: LockSettings;

  logChannelId?: number;
  logEvents: string[];

  reportsEnabled: boolean;
}

export interface LockSettings {
  messages?: boolean;
  media?: boolean;
  stickers?: boolean;
  gifs?: boolean;
  games?: boolean;
  inline?: boolean;
  commands?: boolean;
  photos?: boolean;
  videos?: boolean;
  voice?: boolean;
  audio?: boolean;
  contacts?: boolean;
  documents?: boolean;
  polls?: boolean;
  forward?: boolean;
  url?: boolean;
  bots?: boolean;
  rtl?: boolean;
  arabic?: boolean;
}

export type LockType = keyof LockSettings;

export interface BlacklistEntry {
  id: number;
  chatId: number;
  trigger: string;
  isRegex: boolean;
  action: 'warn' | 'mute' | 'kick' | 'ban' | 'tmute' | 'tban' | 'delete';
  actionTime?: number;
}

export interface FederationData {
  fedId: string;
  name: string;
  ownerId: number;
  logChannel?: number;
  createdAt: number;
}

export interface FedBan {
  fedId: string;
  userId: number;
  bannedBy: number;
  reason?: string;
  expiresAt?: number;
  createdAt: number;
}

export interface TaskPayload {
  type: 'unban' | 'unmute' | 'captcha_expire' | 'delete_message';
  chatId: number;
  userId?: number;
  messageId?: number;
  executeAt: number;
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: ReplyMarkup;
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
  allow_sending_without_reply?: boolean;
  protect_content?: boolean;
  message_thread_id?: number;
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface ParsedTime {
  seconds: number;
  text: string;
}

export type ActionType = 'ban' | 'unban' | 'kick' | 'mute' | 'unmute' | 'warn' | 'unwarn' |
  'promote' | 'demote' | 'pin' | 'unpin' | 'filter_add' | 'filter_remove' |
  'note_add' | 'note_remove' | 'blacklist_add' | 'blacklist_remove' |
  'lock' | 'unlock' | 'fban' | 'funban';
