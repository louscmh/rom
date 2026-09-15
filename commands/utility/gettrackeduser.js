const { EmbedBuilder, SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const { TrackedUser, TrackedServer } = require('../../functions/db/models.js');
const { getService } = require('../../functions/lists/services.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gettrackeduser')
		.setDescription('Get all tracked users in the current server'),
	async execute(interaction) {

		// Only show data for the server the command was run in
		const serverId = interaction.guild.id;

		const trackedUsers = await TrackedUser.findAll({ where: { serverId } });
		const trackedServer = await TrackedServer.findOne({ where: { serverId } });

		const userLines = trackedUsers.map(user => {
			const service = getService(user.service);
			const line = `• [${escapeMarkdown(user.username)}](${service.profileUrl(user.username)}) (${service.tag})`;
			// Activity updates are only read for AniList users
			if (user.service === 'mal') return line;
			const lastUpdate = Number(user.lastReadActivity) > 0 ? `<t:${user.lastReadActivity}:R>` : 'none yet';
			return `${line} - last update ${lastUpdate}`;
		});

		const embed = new EmbedBuilder()
			.setColor(0x1E90FF)
			.setTitle(`Tracked users in ${interaction.guild.name}`)
			.setDescription(userLines.length > 0 ? userLines.join('\n').slice(0, 4096) : 'No users are being tracked. Use `/trackuser` to add one.')
			.addFields({
				name: 'Update channel',
				value: trackedServer?.channelId ? `<#${trackedServer.channelId}>` : 'Not set, use `/trackchannel`',
			})
			.setFooter({ text: 'Data provided by AniList and MyAnimeList' });

		await interaction.reply({ embeds: [embed] });
	},
};
