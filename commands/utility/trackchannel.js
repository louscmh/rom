const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUserActivities, getUserData } = require('../../functions/anilist.js'); // Import the function from anilist.js
const { TrackedServer } = require('../../events/ready.js'); // Adjust the path based on your project structure

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trackchannel')
		.setDescription('Set the update channel to the current channel'),
	async execute(interaction) {
		console.log(interaction);
		await interaction.deferReply();

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

			const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('yes_button')
					.setLabel('Yes')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('no_button')
					.setLabel('No')
					.setStyle(ButtonStyle.Danger) // Red button
			);

			const response = await interaction.editReply({
				content: '',
				embeds: [embed],
				components: [buttons],
			});
	
			const collectorFilter = i => i.user.id === interaction.user.id;
			let failText = 'Confirmation not received, cancelling';

			try {
				const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });
	
				if (confirmation.customId === 'yes_button') {
					// Store the tracked user in the database
					await TrackedServer.create({
						serverId: interaction.guild.id,
						channelId: interaction.channelId,
					});
                    await TrackedServer.sync({ alter: true })
	
					// Confirmation Embed
					const confirmEmbed = new EmbedBuilder()
						.setColor(0x1E90FF)
						.setDescription(`Server and current channel has been successfully added to the tracking system.`)
						.setTimestamp();
	
					await interaction.editReply({ content: null, embeds: [confirmEmbed], components: [] });

				} else if (confirmation.customId === 'no_button') {

					await interaction.editReply({ content: 'Action cancelled.', embeds: [], components: [] });
			
				}
			} catch (e) {

				await interaction.editReply({ content: failText, embeds: [], components: [] });

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
