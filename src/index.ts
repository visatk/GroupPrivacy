import { Env } from './env';
import { TelegramUpdate } from './types';
import { Router } from './lib/router';
import { Database } from './lib/db';
import { setupAdmin } from './modules/admin';
import { setupRules } from './modules/rules';
import { setupNotes } from './modules/notes';
import { setupFilters } from './modules/filters';
import { setupWelcome } from './modules/welcome';
import { sendReply } from './lib/utils';

const router = new Router();

// Track chats and users in DB automatically
router.use(async (ctx, next) => {
  if (ctx.chat) {
    const db = new Database(ctx.env.DB);
    await db.initChat(ctx.chat);
  }
  if (ctx.fromUser) {
    const db = new Database(ctx.env.DB);
    await db.initUser(ctx.fromUser);
  }
  await next();
});

// Setup modules
setupAdmin(router);
setupRules(router);
setupNotes(router);
setupFilters(router);
setupWelcome(router);

// Start command
router.command('start', async (ctx, next) => {
  if (ctx.isPrivate) {
    await sendReply(ctx, "Hello! I am a professional Group Manager Bot, built for Cloudflare Workers.\nAdd me to a group and promote me to admin to start using my features!");
  } else {
    await sendReply(ctx, "I am alive and ready to manage this group.");
  }
});

router.command('ping', async (ctx, next) => {
  const start = Date.now();
  const reply = await sendReply(ctx, "Pong!");
  // Note: editMessageText is not needed unless you really want to show latency.
});

// Help command
router.command('help', async (ctx, next) => {
  const helpText = `*GroupPrivacyPlusBot Help*

*Admin Commands:*
/ban, /unban, /kick, /mute, /unmute
/pin, /unpin

*Rules:*
/rules - View rules
/setrules - Set chat rules (Admin)
/clearrules - Clear chat rules (Admin)

*Notes:*
/save <name> - Save a note (Admin)
/get <name> or #<name> - Get a note
/notes - List notes
/clear <name> - Clear note (Admin)

*Filters:*
/filter <trigger> - Add a filter (Admin)
/stop <trigger> - Remove filter (Admin)
/filters - List filters

*Welcome:*
/welcome on/off - Toggle welcome (Admin)
/setwelcome - Set welcome message (Admin)
`;
  await sendReply(ctx, helpText, { parse_mode: 'Markdown' });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 });
    }

    try {
      const update = await request.json() as TelegramUpdate;
      
      // Use waitUntil to ensure the response is quick and processing continues in background
      ctx.waitUntil(router.handle(update, env).catch(e => {
        console.error("Error processing update:", e);
      }));

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return new Response('Bad Request', { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;
