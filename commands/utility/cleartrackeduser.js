const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUserActivities, getUserData } = require('../../functions/anilist.js'); // Import the function from anilist.js
const { TrackedUser } = require('../../events/ready.js'); // Adjust the path based on your project structure

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleartrackeduser')
		.setDescription('Removes all tracked users in the current server'),
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
