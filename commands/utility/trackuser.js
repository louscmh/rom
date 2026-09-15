const { MessageFlags, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserByName } = require('../../functions/anilist/queries.js');
const { mal } = require('../../functions/mal/client.js');
const { getMalAnimeList } = require('../../functions/mal/queries.js');
const { TrackedUser } = require('../../functions/db/models.js');
const { buildProfileEmbed, buildMalProfileEmbed } = require('../../functions/embeds/profile.js');
const { getService } = require('../../functions/lists/services.js');
const { askConfirmation } = require('../../functions/ui/confirm.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trackuser')
		.setDescription('Track a user\'s AniList or MyAnimeList using their username')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('The user\'s name on AniList or MyAnimeList')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('service')
				.setDescription('Which site the username is from (default: AniList)')
				.addChoices(
					{ name: 'AniList', value: 'anilist' },
					{ name: 'MyAnimeList', value: 'mal' },
				))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		const username = interaction.options.getString('username', true);
		const service = interaction.options.getString('service') ?? 'anilist';

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const profile = service === 'mal' ? await findMalProfile(username) : await findAniListProfile(username);
		if (profile.error) {
			return interaction.editReply(profile.error);
		}

		const confirmed = await askConfirmation(interaction, {
			content: `Confirmation to track this ${getService(service).name} in this server?`,
			embeds: [profile.embed],
		});

		if (confirmed === null) {
			return interaction.editReply({ content: 'Confirmation not received, cancelling', embeds: [], components: [] });
		}
		if (!confirmed) {
			return interaction.editReply({ content: 'Action cancelled.', embeds: [], components: [] });
		}

		const existingUser = await TrackedUser.findOne({
			where: {
				serverId: interaction.guild.id,
				userId: profile.userId,
				service,
			},
		});

		if (existingUser) {
			return interaction.editReply({ content: 'The user has already been tracked!', embeds: [], components: [] });
		}

		await TrackedUser.create({
			userId: profile.userId,
			username: profile.username,
			serverId: interaction.guild.id,
			lastReadActivity: 0,
			service,
		});

		const confirmEmbed = new EmbedBuilder()
			.setColor(0x1E90FF)
			.setTitle('User Added Successfully!')
			.setDescription(`${profile.username} has been successfully added to the tracking system.`)
			.setTimestamp();

		await interaction.editReply({ content: null, embeds: [confirmEmbed], components: [] });
	},
};

// Each returns { userId, username, embed } for the confirmation, or { error } to show instead

async function findAniListProfile(username) {
	const userdata = await getUserByName(username);
	if (!userdata) {
		return { error: 'Could not fetch user data. Please make sure the username is correct.' };
	}
	return { userId: userdata.id, username: userdata.name, embed: buildProfileEmbed(userdata) };
}

async function findMalProfile(username) {
	if (!mal.isConfigured) {
		return { error: 'MyAnimeList support isn\'t configured on this bot.' };
	}

	let entries;
	try {
		entries = await getMalAnimeList(username);
	} catch (error) {
		if (error.status === 404) {
			return { error: 'Could not find that MyAnimeList user. Please make sure the username is correct.' };
		}
		throw error;
	}

	// MAL usernames are case-insensitive, so the id is lowercased to catch duplicates
	return { userId: username.toLowerCase(), username, embed: buildMalProfileEmbed(username, entries) };
}
