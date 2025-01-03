const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUserActivities, getUserData } = require('../../functions/anilist.js'); // Import the function from anilist.js
const { TrackedUser, TrackedServer } = require('../../events/ready.js'); // Adjust the path based on your project structure

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gettrackeduser')
		.setDescription('Get all tracked users in the current server'),
	async execute(interaction) {

		// Get the current server (guild) ID
		const serverId = interaction.guild.id;

		// Fetch all tracked users in the current server
		const trackedUsers = await TrackedUser.findAll();
		const trackedChannel = await TrackedServer.findAll();

        console.log(trackedUsers.map(user => user.toJSON()));
        await interaction.reply(`\`\`\`
${JSON.stringify(trackedUsers, null, 2)}
\`\`\`\n\`\`\`
${JSON.stringify(trackedChannel, null, 2)}
\`\`\``);

	},
};
