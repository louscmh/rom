const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user or a server!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Info about a user')
                .addUserOption(option => option.setName('target').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Info about the server')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'user') {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const member = interaction.guild.members.cache.get(targetUser.id);

            await interaction.reply({
                content: `**User Information:**\n` +
                         `Username: ${targetUser.tag}\n` +
                         `ID: ${targetUser.id}\n` +
                         `Created At: ${targetUser.createdAt}\n` +
                         (member ? `Joined Server At: ${member.joinedAt}\n` : ''),
                ephemeral: true
            });
        } else if (interaction.options.getSubcommand() === 'server') {
            const guild = interaction.guild;

            await interaction.reply({
                content: `**Server Information:**\n` +
                         `Name: ${guild.name}\n` +
                         `ID: ${guild.id}\n` +
                         `Member Count: ${guild.memberCount}\n` +
                         `Created At: ${guild.createdAt}\n` +
                         `Owner: <@${guild.ownerId}>\n` +
                         `Verification Level: ${guild.verificationLevel}`,
                ephemeral: true
            });
        }
    }
}