const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('wow')
		.setDescription('Says wow and something lse')
		.addStringOption(option =>
			option.setName('text')
				.setDescription('The text to say.')
				.setRequired(true)),
	async execute(interaction) {
		const text = interaction.options.getString('text', true);
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply(`Holy shit, ${text}`);
	},
};
