const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Whether or not the echo should be ephemeral')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
				.setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to echo into')
                .addChannelTypes(ChannelType.GuildText)),
    async execute(interaction) {
        const text = interaction.options.getString('input', true);
        const ephemeral = interaction.options.getBoolean('ephemeral', true);
        // interaction.guild is the object representing the Guild in which the command was run
        if (ephemeral) {
            await interaction.reply({content:`Holy shit, ${text}`,flags: MessageFlags.Ephemeral});
        } else {
            await interaction.reply({content:`Holy shit, ${text}`});
        }
    }
}