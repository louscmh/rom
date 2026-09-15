const { SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const { TrackedUser } = require('../../functions/db/models.js');
const { mal } = require('../../functions/mal/client.js');
const { getMalAnimeMean } = require('../../functions/mal/queries.js');
const { buildAnimeEmbed } = require('../../functions/embeds/anime.js');
const { getServerEntry } = require('../../functions/lists/entries.js');
const { getService } = require('../../functions/lists/services.js');
const { STATUS_ORDER, statusLabel, formatProgress } = require('../../functions/format/entry.js');
const { pickAnime } = require('../../functions/ui/pickAnime.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('anime')
		.setDescription('Get details about an anime!')
		.addStringOption(option =>
			option.setName('anime')
				.setDescription('The anime\'s name')
				.setRequired(true)),
	async execute(interaction) {
		const search = interaction.options.getString('anime', true);

		await interaction.deferReply();
		const media = await pickAnime(interaction, search);
		// pickAnime has already explained why when nothing was picked
		if (!media) return;

		const embed = buildAnimeEmbed(media, { malMean: await fetchMalMean(media) });
		await addServerEntries(embed, media, interaction.guild.id);
		await interaction.editReply({ content: '', embeds: [embed], components: [] });
	},
};

// MAL's average score, or null when MAL isn't configured, the anime isn't on MAL, or the request fails
async function fetchMalMean(media) {
	if (!mal.isConfigured || !media.idMal) return null;
	try {
		return await getMalAnimeMean(media.idMal);
	} catch (error) {
		console.error(`Could not fetch MAL score for anime ${media.id}:`, error.message);
		return null;
	}
}

// Adds two stacked sections from this server's tracked users' list entries:
// "Server Scores" (users who scored it) and "Server Progress" (everyone except plan-to-watch).
// Each section is left out when empty.
async function addServerEntries(embed, media, serverId) {
	const trackedUsers = await TrackedUser.findAll({ where: { serverId } });

	// One lookup per user feeds both sections
	const entries = [];
	for (const user of trackedUsers) {
		try {
			const entry = await getServerEntry(user, media);
			if (entry) entries.push({ user, entry });
		} catch (error) {
			console.error(`Could not fetch ${user.username}'s entry for anime ${media.id}:`, error.message);
		}
	}

	const nameOf = (user) => `${escapeMarkdown(user.username)} (${getService(user.service).tag})`;

	const scoreLines = entries
		.filter(({ entry }) => entry.scoreText)
		.map(({ user, entry }) => `${nameOf(user)} - \`${entry.scoreText}\``);

	const progressLines = entries
		.filter(({ entry }) => entry.status !== 'planning')
		.sort((a, b) => STATUS_ORDER.indexOf(a.entry.status) - STATUS_ORDER.indexOf(b.entry.status) || b.entry.progress - a.entry.progress)
		.map(({ user, entry }) => `${nameOf(user)} - ${statusLabel(entry.status)} · ${formatProgress(entry.progress, media.episodes)}`);

	if (scoreLines.length > 0) {
		embed.addFields({ name: 'Server Scores', value: joinFieldLines(scoreLines), inline: false });
	}
	if (progressLines.length > 0) {
		embed.addFields({ name: 'Server Progress', value: joinFieldLines(progressLines), inline: false });
	}
}

// Joins lines into an embed field value, dropping whole lines that would pass Discord's 1024-character limit
function joinFieldLines(lines) {
	let value = '';
	for (const line of lines) {
		const next = value ? `${value}\n${line}` : line;
		if (next.length > 1024) break;
		value = next;
	}
	return value;
}
