const { MessageFlags, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TrackedServer } = require('../../functions/db/models.js');
const { askConfirmation } = require('../../functions/ui/confirm.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trackchannel')
		.setDescription('Set the update channel to the current channel')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		await interaction.deferReply({flags: MessageFlags.Ephemeral});

		const existingServer = await TrackedServer.findOne({
			where: {
				serverId: interaction.guild.id,
			},
		});

		if (existingServer && existingServer.channelId != interaction.channelId) {

			const embed = new EmbedBuilder()
			.setColor(0x1E90FF) // Set a color for the embed
			.setDescription(`Tracking current channel!`)

			existingServer.channelId = interaction.channelId;
			await existingServer.save();

			await interaction.editReply({
				content: '',
				embeds: [embed],
				components: [],
			});

		} else if (!existingServer) {
			
			const embed = new EmbedBuilder()
			.setColor(0x1E90FF) // Set a color for the embed
			.setDescription(`The current server is not being tracked at the moment. Track server and current channel?`)

			const confirmed = await askConfirmation(interaction, { embeds: [embed] });

			if (confirmed === null) {
				await interaction.editReply({ content: 'Confirmation not received, cancelling', embeds: [], components: [] });
			} else if (!confirmed) {
				await interaction.editReply({ content: 'Action cancelled.', embeds: [], components: [] });
			} else {
				// Store the tracked server in the database
				await TrackedServer.create({
					serverId: interaction.guild.id,
					channelId: interaction.channelId,
				});

				// Confirmation Embed
				const confirmEmbed = new EmbedBuilder()
					.setColor(0x1E90FF)
					.setDescription(`Server and current channel has been successfully added to the tracking system.`)
					.setTimestamp();

				await interaction.editReply({ content: null, embeds: [confirmEmbed], components: [] });
			}
		} else if (existingServer && existingServer.channelId == interaction.channelId) {

			const embed = new EmbedBuilder()
			.setColor(0xFF0000) // Set a color for the embed
			.setDescription(`The current channel has already been tracked!`)

			existingServer.channelId = interaction.channelId;
			await existingServer.save();

			await interaction.editReply({
				content: '',
				embeds: [embed],
				components: [],
			});
		}
	},
};
