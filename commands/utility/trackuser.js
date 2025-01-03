const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUserActivities, getUserData } = require('../../functions/anilist.js'); // Import the function from anilist.js
const { TrackedUser } = require('../../events/ready.js'); // Adjust the path based on your project structure

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trackuser')
		.setDescription('Track a user\'s Anilist using their username')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The user\'s name on Anilist')
				.setRequired(true)),
	async execute(interaction) {

        const username = interaction.options.getString('username', true);
        
		await interaction.deferReply();
        const userdata = await getUserData(username)

        if (!userdata) {
			return interaction.editReply('Could not fetch user data. Please make sure the username is correct.');
		}
        // console.log(userdata)

        // Create an embed
		const embed = new EmbedBuilder()
        .setColor(0x1E90FF) // Set a color for the embed
        .setTitle(`${userdata.name}'s Profile`) // User's name as the title
        .setThumbnail(userdata.avatar.large) // User's profile picture
        .addFields(
            { name: 'Anime Watched', value: `${userdata.statistics.anime.count}`, inline: true },
            { name: 'Mean Anime Score', value: `${userdata.statistics.anime.meanScore ?? 'N/A'}`, inline: true },
            { name: 'Manga Read', value: `${userdata.statistics.manga.count}`, inline: true },
            { name: 'Mean Manga Score', value: `${userdata.statistics.manga.meanScore ?? 'N/A'}`, inline: true }
        )
        .setFooter({ text: 'Data provided by AniList' })
        .setTimestamp(); // Add a timestamp

        // Create "Yes" and "No" buttons
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

        // Send the initial message with the embed and buttons
        const response = await interaction.editReply({
            content: 'Confirmation to track this AniList in this server?',
            embeds: [embed],
            components: [buttons],
        });

        const collectorFilter = i => i.user.id === interaction.user.id;
        let failText = 'Confirmation not received, cancelling';

        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });
            // console.log(confirmation.customId);

            if (confirmation.customId === 'yes_button') {
                
                const existingUser = await TrackedUser.findOne({
                    where: {
                        serverId: interaction.guild.id,
                        userId: userdata.id,
                    },
                });
                
                if (existingUser) {
                    await interaction.editReply({ content: 'The user has already been tracked!', embeds: [], components: [] });
                } else {
                    await TrackedUser.create({
                        userId: userdata.id,
                        username: userdata.name, 
                        serverId: interaction.guild.id,
                        lastReadActivity: 0,
                    });
                    await TrackedUser.sync({ alter: true })
    
                    // Confirmation Embed
                    const confirmEmbed = new EmbedBuilder()
                        .setColor(0x1E90FF)
                        .setTitle('User Added Successfully!')
                        .setDescription(`${userdata.name} has been successfully added to the tracking system.`)
                        .setTimestamp();
    
                    await interaction.editReply({ content: null, embeds: [confirmEmbed], components: [] });
                }
			} else if (confirmation.customId === 'no_button') {
				await interaction.editReply({ content: 'Action cancelled.', embeds: [], components: [] });
			}
        } catch (e) {
            await interaction.editReply({ content: failText, embeds: [], components: [] });
        }
	},
};
