-- ============================================================
-- GroupPrivacyPlusBot - D1 Database Schema
-- ============================================================


PRAGMA foreign_keys = ON;

-- ============================================================
-- CHATS
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  chat_id       INTEGER PRIMARY KEY,
  title         TEXT NOT NULL DEFAULT '',
  username      TEXT,
  type          TEXT NOT NULL DEFAULT 'group',
  lang          TEXT NOT NULL DEFAULT 'en',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       INTEGER PRIMARY KEY,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT,
  username      TEXT,
  is_bot        INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- CHAT MEMBERS (admin cache)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_members (
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'member',
  custom_title  TEXT,
  can_delete_messages INTEGER DEFAULT 0,
  can_restrict_members INTEGER DEFAULT 0,
  can_promote_members  INTEGER DEFAULT 0,
  can_change_info      INTEGER DEFAULT 0,
  can_pin_messages     INTEGER DEFAULT 0,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chat_id);

-- ============================================================
-- BANS
-- ============================================================
CREATE TABLE IF NOT EXISTS bans (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  banned_by     INTEGER NOT NULL,
  reason        TEXT,
  expires_at    INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_bans_chat ON bans(chat_id);
CREATE INDEX IF NOT EXISTS idx_bans_expires ON bans(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- MUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS mutes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  muted_by      INTEGER NOT NULL,
  reason        TEXT,
  expires_at    INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_mutes_chat ON mutes(chat_id);
CREATE INDEX IF NOT EXISTS idx_mutes_expires ON mutes(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- WARNINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS warnings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  warned_by     INTEGER NOT NULL,
  reason        TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_warnings_chat_user ON warnings(chat_id, user_id);

-- ============================================================
-- WARN SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS warn_settings (
  chat_id       INTEGER PRIMARY KEY,
  warn_limit    INTEGER NOT NULL DEFAULT 3,
  warn_mode     TEXT NOT NULL DEFAULT 'mute',  -- 'ban' | 'kick' | 'mute'
  warn_time     INTEGER                          -- seconds for temp action, NULL = permanent
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  name          TEXT NOT NULL COLLATE NOCASE,
  content       TEXT,
  file_id       TEXT,
  file_type     TEXT,                            -- 'photo'|'video'|'document'|'audio'|'sticker'|'gif'
  parse_mode    TEXT NOT NULL DEFAULT 'HTML',
  buttons       TEXT,                            -- JSON array of inline button rows
  created_by    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(chat_id, name)
);
CREATE INDEX IF NOT EXISTS idx_notes_chat ON notes(chat_id);

-- ============================================================
-- FILTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS filters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  trigger       TEXT NOT NULL COLLATE NOCASE,
  content       TEXT,
  file_id       TEXT,
  file_type     TEXT,
  parse_mode    TEXT NOT NULL DEFAULT 'HTML',
  buttons       TEXT,
  is_regex      INTEGER NOT NULL DEFAULT 0,
  created_by    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(chat_id, trigger)
);
CREATE INDEX IF NOT EXISTS idx_filters_chat ON filters(chat_id);

-- ============================================================
-- WELCOME / GOODBYE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS welcome_settings (
  chat_id           INTEGER PRIMARY KEY,
  welcome_enabled   INTEGER NOT NULL DEFAULT 1,
  welcome_msg       TEXT,
  welcome_file_id   TEXT,
  welcome_file_type TEXT,
  welcome_buttons   TEXT,
  welcome_parse_mode TEXT NOT NULL DEFAULT 'HTML',
  welcome_delete_after INTEGER DEFAULT 0,        -- seconds, 0 = no delete

  goodbye_enabled   INTEGER NOT NULL DEFAULT 1,
  goodbye_msg       TEXT,
  goodbye_file_id   TEXT,
  goodbye_file_type TEXT,
  goodbye_buttons   TEXT,
  goodbye_parse_mode TEXT NOT NULL DEFAULT 'HTML',

  captcha_enabled   INTEGER NOT NULL DEFAULT 0,
  captcha_type      TEXT NOT NULL DEFAULT 'button', -- 'button'|'math'|'word'
  captcha_timeout   INTEGER NOT NULL DEFAULT 120,   -- seconds
  captcha_action    TEXT NOT NULL DEFAULT 'kick',   -- 'kick'|'ban'|'mute'

  clean_service     INTEGER NOT NULL DEFAULT 0,
  clean_welcome     INTEGER NOT NULL DEFAULT 0,

  updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- CAPTCHA PENDING
-- ============================================================
CREATE TABLE IF NOT EXISTS captcha_pending (
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  captcha_type  TEXT NOT NULL,
  answer        TEXT NOT NULL,
  message_id    INTEGER,
  expires_at    INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_captcha_expires ON captcha_pending(expires_at);

-- ============================================================
-- RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS rules (
  chat_id       INTEGER PRIMARY KEY,
  content       TEXT NOT NULL DEFAULT '',
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- BLACKLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS blacklist (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  trigger       TEXT NOT NULL COLLATE NOCASE,
  is_regex      INTEGER NOT NULL DEFAULT 0,
  action        TEXT NOT NULL DEFAULT 'warn',    -- 'warn'|'mute'|'kick'|'ban'|'tmute'|'tban'|'delete'
  action_time   INTEGER,                          -- seconds for temp actions
  created_by    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(chat_id, trigger)
);
CREATE INDEX IF NOT EXISTS idx_blacklist_chat ON blacklist(chat_id);

-- ============================================================
-- CHAT SETTINGS (anti-spam, locks, etc)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_settings (
  chat_id                 INTEGER PRIMARY KEY,

  -- Anti-flood
  flood_limit             INTEGER NOT NULL DEFAULT 0,     -- 0 = disabled
  flood_window            INTEGER NOT NULL DEFAULT 15,    -- seconds
  flood_action            TEXT NOT NULL DEFAULT 'mute',   -- 'mute'|'kick'|'ban'|'tban'|'tmute'
  flood_action_time       INTEGER,

  -- Anti-link
  antilink_enabled        INTEGER NOT NULL DEFAULT 0,
  antilink_action         TEXT NOT NULL DEFAULT 'warn',
  antilink_whitelist      TEXT,                           -- JSON array of allowed domains

  -- Anti-forward
  antiforward_enabled     INTEGER NOT NULL DEFAULT 0,
  antiforward_action      TEXT NOT NULL DEFAULT 'delete',

  -- Anti-Arabic
  antiarabic_enabled      INTEGER NOT NULL DEFAULT 0,
  antiarabic_action       TEXT NOT NULL DEFAULT 'delete',

  -- Anti-RTL
  antirtl_enabled         INTEGER NOT NULL DEFAULT 0,
  antirtl_action          TEXT NOT NULL DEFAULT 'delete',

  -- Anti-bot
  antibot_enabled         INTEGER NOT NULL DEFAULT 0,

  -- Locks (JSON object of lock types)
  locks                   TEXT NOT NULL DEFAULT '{}',

  -- Log channel
  log_channel_id          INTEGER,
  log_events              TEXT NOT NULL DEFAULT '["ban","unban","mute","unmute","warn","kick","promote","demote","pin"]',

  -- Reports
  reports_enabled         INTEGER NOT NULL DEFAULT 1,

  -- Misc
  allow_commands_pm       INTEGER NOT NULL DEFAULT 1,

  updated_at              INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- FLOOD TRACKING (ephemeral, but stored for cross-request consistency)
-- ============================================================
CREATE TABLE IF NOT EXISTS flood_track (
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  count         INTEGER NOT NULL DEFAULT 1,
  window_start  INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);

-- ============================================================
-- FEDERATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS federations (
  fed_id        TEXT PRIMARY KEY,                 -- UUID
  name          TEXT NOT NULL,
  owner_id      INTEGER NOT NULL,
  log_channel   INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS fed_admins (
  fed_id        TEXT NOT NULL REFERENCES federations(fed_id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL,
  added_by      INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (fed_id, user_id)
);

CREATE TABLE IF NOT EXISTS fed_chats (
  fed_id        TEXT NOT NULL REFERENCES federations(fed_id) ON DELETE CASCADE,
  chat_id       INTEGER NOT NULL,
  joined_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (fed_id, chat_id)
);

CREATE TABLE IF NOT EXISTS fed_bans (
  fed_id        TEXT NOT NULL REFERENCES federations(fed_id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL,
  banned_by     INTEGER NOT NULL,
  reason        TEXT,
  expires_at    INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (fed_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_fed_bans_user ON fed_bans(user_id);

-- ============================================================
-- USER CONNECTIONS (PM management)
-- ============================================================
CREATE TABLE IF NOT EXISTS connections (
  user_id       INTEGER NOT NULL,
  chat_id       INTEGER NOT NULL,
  connected_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id)
);

-- ============================================================
-- STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS action_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  action        TEXT NOT NULL,
  target_id     INTEGER,
  reason        TEXT,
  extra         TEXT,                             -- JSON
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_logs_chat ON action_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON action_logs(created_at);

-- ============================================================
-- GLOBAL BANS (bot-level)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_bans (
  user_id       INTEGER PRIMARY KEY,
  banned_by     INTEGER NOT NULL,
  reason        TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- BOT STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_stats (
  key           TEXT PRIMARY KEY,
  value         INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO bot_stats(key, value) VALUES
  ('total_chats', 0),
  ('total_users', 0),
  ('total_messages', 0),
  ('total_bans', 0),
  ('total_warns', 0);
