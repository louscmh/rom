const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { scan } = require('../../events/ready.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('refreshtrack')
		.setDescription('Refreshes the tracking system instantly')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		// Ephemeral "thinking..." indicator, only visible to whoever ran the command
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const ran = await scan(interaction.client);
		if (ran) {
			// Remove the indicator once the scan has finished
			await interaction.deleteReply();
		} else {
			await interaction.editReply('A scan is already running. Try again in a moment.');
		}
	},
};
