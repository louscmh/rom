const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TrackedUser } = require('../../functions/db/models.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleartrackeduser')
		.setDescription('Removes all tracked users in the current server')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {

		// Get the current server (guild) ID
		const serverId = interaction.guild.id;

		// Fetch all tracked users in the current server
		const trackedUsers = await TrackedUser.findAll({ where: { serverId } });

		// If no tracked users are found, notify the user
		if (trackedUsers.length === 0) {
			return interaction.reply('No tracked users found in this server.');
		}

		// Log the tracked users being removed (optional)
		console.log('Tracked users being removed:', trackedUsers.map(user => user.toJSON()));

		// Remove all tracked users in the current server
		await TrackedUser.destroy({ where: { serverId } });

		// Send a confirmation message
		const embed = new EmbedBuilder()
			.setColor(0xFF0000)
			.setTitle('Tracked Users Cleared')
			.setDescription(`All tracked users have been successfully removed from the server **${interaction.guild.name}**.`)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });

	},
};
