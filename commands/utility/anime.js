const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { searchanimebytitle, getanimesearchlength, getsearchembed, createanimeembed } = require('../../functions/getanime.js'); // Import the function from anilist.js
const { TrackedUser } = require('../../events/ready.js'); // Adjust the path based on your project structure

module.exports = {
	data: new SlashCommandBuilder()
		.setName('anime')
		.setDescription('Get details about an anime!')
        .addStringOption(option =>
            option.setName('anime')
                .setDescription('The anime\'s name')
				.setRequired(true)),
	async execute(interaction) { 

        const anime = interaction.options.getString('anime', true);

        await interaction.deferReply();
        let currentPage = 1
        let animedata = await searchanimebytitle(anime,currentPage);
        const listlength = await getanimesearchlength(anime);
        let animeCount = listlength > 3 ? 3 : listlength;
        console.log(animedata);
        console.log(`Amount of anime: ${listlength}`);

        if (!animedata) {
			return interaction.editReply('Could not fetch anime data. Please make sure the input resembles the name of the anime you\'re looking for!.');
		}

        if (listlength == 1) {
            finalEmbeds = await createanimeembed(animedata.media[0],false);
            await interaction.editReply({content: "", embeds: [finalEmbeds], components: []});
            return;
        } else {
            let [finalEmbeds, buttons] = await getsearchembed(animedata, animeCount, currentPage, listlength);

            let response = await interaction.editReply({content: "Displaying search results:", embeds: finalEmbeds, components: [buttons]});
            const collectorFilter = i => i.user.id === interaction.user.id;

            while (true) {

                try {
                    let confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 45_000 });
                    await confirmation.deferUpdate();

                    if (confirmation.customId === 'left_button') {
                        currentPage--;
                        animeCount = listlength-((currentPage-1)*3) > 3 ? 3 : listlength-((currentPage-1)*3);
                        animedata = await searchanimebytitle(anime,currentPage);
                        [finalEmbeds, buttons] = await getsearchembed(animedata, animeCount, currentPage, listlength);
                        response = await interaction.editReply({content: "Displaying search results:", embeds: finalEmbeds, components: [buttons]});
                    } else if (confirmation.customId === 'right_button') {
                        currentPage++;
                        animeCount = listlength-((currentPage-1)*3) > 3 ? 3 : listlength-((currentPage-1)*3);
                        animedata = await searchanimebytitle(anime,currentPage);
                        [finalEmbeds, buttons] = await getsearchembed(animedata, animeCount, currentPage, listlength);
                        response = await interaction.editReply({content: "Displaying search results:", embeds: finalEmbeds, components: [buttons]});
                    } else if (/\d/.test(confirmation.customId)) {
                        let index = confirmation.customId.replace(/\D/g, '');
                        let displayAnime = animedata.media[index-1];
                        finalEmbeds = await createanimeembed(displayAnime,interaction.guild.id);
                        console.log("happened 1");
                        await interaction.editReply({content: "", embeds: [finalEmbeds], components: []});
                        return;
                    }
                } catch (e) {
                    await interaction.editReply({content: "Displaying search results:", embeds: finalEmbeds, components: []});
                    return;
                }
            }
        }
    }
};