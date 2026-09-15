const { EmbedBuilder } = require('discord.js');
const { errorChannelId } = require('../config.json');

// The same error is only posted to Discord once per window, so a persistent failure
// (e.g. a renamed AniList user) doesn't post on every 5-minute scan
const REPEAT_WINDOW = 30 * 60 * 1000; // 30 minutes
const lastSent = new Map();
let client = null;

function setClient(discordClient) {
  client = discordClient;
}

async function report(level, context, error) {
  const log = level === 'warn' ? console.warn : console.error;
  log(`[${context}]`, error);

  // Can only post once the bot is logged in and a channel is configured
  if (!errorChannelId || !client?.isReady()) return;

  const message = error instanceof Error ? error.message : String(error);
  const key = `${level}|${context}|${message}`;
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < REPEAT_WINDOW) return;
  lastSent.set(key, now);
  for (const [k, sentAt] of lastSent) {
    if (now - sentAt >= REPEAT_WINDOW) lastSent.delete(k);
  }

  try {
    const channel = await client.channels.fetch(errorChannelId);
    if (!channel?.isTextBased()) {
      console.error(`[errorlog] Channel ${errorChannelId} is missing or not a text channel`);
      return;
    }
    const details = (error instanceof Error ? error.stack ?? message : message).replaceAll('```', "'''");
    const embed = new EmbedBuilder()
      .setColor(level === 'warn' ? 0xFFA500 : 0xFF0000)
      .setTitle(`${level === 'warn' ? 'Warning' : 'Error'}: ${context}`.slice(0, 256))
      .setDescription(`\`\`\`\n${details.slice(0, 3900)}\n\`\`\``)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (sendError) {
    // Never report this failure through report() itself, to avoid a loop
    console.error('[errorlog] Could not send to error channel:', sendError);
  }
}

module.exports = {
  setClient,
  reportError: (context, error) => report('error', context, error),
  reportWarning: (context, message) => report('warn', context, message),
};
