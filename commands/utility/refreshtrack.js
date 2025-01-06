const { SlashCommandBuilder } = require('discord.js');
const { scan } = require('../../events/ready.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('refreshtrack')
		.setDescription('Refreshes the tracking system instantly'),
	async execute(interaction) {
        await interaction.deferReply();
		await scan(interaction.client);
		return;
	},
};
