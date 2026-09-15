const { EmbedBuilder, Events } = require('discord.js');
const POLL_INTERVAL = 300000; // 5 minutes
const { getUserActivities, getUserData, getanimescore } = require('../functions/anilist.js'); // Import the function from anilist.js
const { reportError, reportWarning } = require('../functions/errorlog.js');
const trackedUsers = {};
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const TrackedUser = sequelize.define('TrackedUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Automatically increment the ID
    },
	userId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	serverId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	lastReadActivity: {
		type: DataTypes.STRING,
		allowNull: true,
	},
}, {
	timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const TrackedServer = sequelize.define('TrackedServer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Automatically increment the ID
    },
	serverId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	channelId: {
		type: DataTypes.STRING,
		allowNull: true,
	},
}, {
	timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Creates missing tables only. Called once from index.js before login; it never alters
// existing tables, so a model change needs a one-off migration instead
async function syncDatabase() {
	await TrackedUser.sync();
	await TrackedServer.sync();
	console.log('Database tables synchronized');
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		(async () => {
			try {

				// Initial scan
				scan(client);

				setInterval(async () => {
					scan(client);
				}, POLL_INTERVAL);

			} catch (error) {
				console.error('Error fetching tracked users:', error);
			}
		})();
	},
	TrackedUser,
	TrackedServer,
	scan,
	syncDatabase,
};

async function checkForUpdates(user, channelId, client) {
	console.log("Update check initiated");
	console.log(`User: ${user.username}`);
	const userdata = await getUserData(user.username);
	if (!userdata) {
		await reportWarning('tracker', `Skipping ${user.username}: AniList profile not found or request failed (renamed, deleted, or rate limited?)`);
		return;
	}
	const userId = userdata.id;
	const avatar = userdata.avatar?.large;
	const activities = await getUserActivities(userId);
	let latestActivityIndex = 0;
	await delay(1000);

	if (activities.length === 0) return;

	for (let i = 0; i <= activities.length - 1; i++) {
		let activity = activities[i];
		if (activity.createdAt <= user.lastReadActivity) {
			break;
		}
		latestActivityIndex++;
	}

	console.log(`Update count: ${latestActivityIndex == 0 ? 0 : latestActivityIndex+1}`);
	if (latestActivityIndex === 0) return;

	let finalEmbeds = [];

	let top = new EmbedBuilder()
		.setColor(0x1E90FF)
		.setAuthor({
			name: user.username,
			iconURL: avatar
		})
		.setDescription(`**${user.username}** just updated their activity:`) // Embed description with context
		.setFooter({ text: 'Data provided by AniList' });

	finalEmbeds.push(top);

	for (let i = latestActivityIndex - 1; i >= 0; i--) {
		let latestActivity = activities[i];
		// Media can be null if the entry was removed from AniList
		if (!latestActivity?.media) continue;
		await delay(1000);
		// console.log(latestActivity.media.id);
		let animedata = await getanimescore(latestActivity.media.id, userId)
		// console.log(animedata);

		if (latestActivity.status == "watched episode" && latestActivity.createdAt != null) {
			// console.log(latestActivity);
			
			let embed = new EmbedBuilder()
				.setAuthor({
				name: latestActivity.media.title.english ?? latestActivity.media.title.romaji ?? latestActivity.media.title.native,
				url: latestActivity.media.siteUrl,
				})
				.setColor(0x1E90FF)
				.setThumbnail(latestActivity.media.coverImage?.large ?? null)
				.setTitle(latestActivity.progress?.includes("-") ? "Watched episodes" : "Watched an episode")
				// Lines are joined instead of using a multi-line template string, whose source
				// indentation would show up as leading whitespace on mobile
				.setDescription([
					`• **Average Score:** ${latestActivity.media.meanScore ?? "N.A"}/100`,
					`• **Episodes:** ${latestActivity.progress}/${latestActivity.media.episodes ?? "N.A"}`,
					`• **Genres:** ${latestActivity.media.genres?.length ? latestActivity.media.genres.join(", ") : "N.A"}`,
				].join("\n"))
				.addFields(
					{ name: 'Time of Activity', value: `<t:${Math.floor(latestActivity.createdAt)}:R>`, inline: false },
				)
				.setFooter({
					text: latestActivity.media.season != null ? `Released in ${latestActivity.media.season.charAt(0).toUpperCase() + latestActivity.media.season.slice(1).toLowerCase()} ${latestActivity.media.seasonYear} · ${latestActivity.media.siteUrl}` : `No season data · ${latestActivity.media.siteUrl}`,
				});
			finalEmbeds.push(embed);

		} else if (latestActivity.status == "completed" && latestActivity.createdAt != null) {

			let embed = new EmbedBuilder()
				.setAuthor({
				name: latestActivity.media.title.english ?? latestActivity.media.title.romaji ?? latestActivity.media.title.native,
				url: latestActivity.media.siteUrl,
				})
				.setColor(0x2FBB2F)
				.setThumbnail(latestActivity.media.coverImage?.large ?? null)
				.setTitle("Completed Anime")
				.setDescription([
					`• **Average Score:** ${latestActivity.media.meanScore ?? "N.A"}/100`,
					`• **Score Given:** ${animedata?.score || "Not scored"}`,
					`• **Episodes:** ${latestActivity.media.episodes ?? "N.A"}/${latestActivity.media.episodes ?? "N.A"}`,
					`• **Genres:** ${latestActivity.media.genres?.length ? latestActivity.media.genres.join(", ") : "N.A"}`,
				].join("\n"))
				.addFields(
					{ name: 'Time of Activity', value: `<t:${Math.floor(latestActivity.createdAt)}:R>`, inline: false },
				)
				.setFooter({
					text: latestActivity.media.season != null ? `Released in ${latestActivity.media.season.charAt(0).toUpperCase() + latestActivity.media.season.slice(1).toLowerCase()} ${latestActivity.media.seasonYear} · ${latestActivity.media.siteUrl}` : `No season data · ${latestActivity.media.siteUrl}`,
				});
			finalEmbeds.push(embed);
		} else if (latestActivity.status == "plans to watch" && latestActivity.createdAt != null) {

			let embed = new EmbedBuilder()
				.setAuthor({
				name: latestActivity.media.title.english ?? latestActivity.media.title.romaji ?? latestActivity.media.title.native,
				url: latestActivity.media.siteUrl,
				})
				.setColor(0xFFFF00)
				.setThumbnail(latestActivity.media.coverImage?.large ?? null) 
				.setTitle("Plan to watch")
				.setDescription([
					`• **Average Score:** ${latestActivity.media.meanScore ?? "N.A"}/100`,
					`• **Episodes:** 0/${latestActivity.media.episodes ?? "N.A"}`,
					`• **Genres:** ${latestActivity.media.genres?.length ? latestActivity.media.genres.join(", ") : "N.A"}`,
				].join("\n"))
				.addFields(
					{ name: 'Time of Activity', value: `<t:${Math.floor(latestActivity.createdAt)}:R>`, inline: false },
				)
				.setFooter({
					text: latestActivity.media.season != null ? `Released in ${latestActivity.media.season.charAt(0).toUpperCase() + latestActivity.media.season.slice(1).toLowerCase()} ${latestActivity.media.seasonYear} · ${latestActivity.media.siteUrl}` : `No season data · ${latestActivity.media.siteUrl}`,
				});
			finalEmbeds.push(embed);
		}
	}

	if (finalEmbeds.length === 1) {
		// Only the header embed, i.e. none of the new activities have a supported status
		user.lastReadActivity = activities[0].createdAt;
		await user.save();
		console.log(`No displayable updates for ${user.username}, marked as read`);
		return;
	}

	console.log(`channel id to send: ${channelId}`)
	const channel = await client.channels.fetch(channelId);
	if (!channel?.isTextBased()) {
		throw new Error(`Channel ${channelId} is missing or not a text channel`);
	}
	await channel.send({ content: "", embeds: finalEmbeds, components: [] });
	// Only mark as read once the updates are actually posted, so a failed send is retried next scan
	user.lastReadActivity = activities[0].createdAt;
	await user.save();
	await channel.send({ content: "** **", embeds: [], components: [] });
	console.log(`Update for ${user.username} performed`);

}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Prevents the interval and /refreshtrack from scanning at the same time and posting duplicates
let scanInProgress = false;

// Returns false if skipped because another scan is still running
async function scan(client) {
	if (scanInProgress) {
		console.log('Scan already in progress, skipping');
		return false;
	}
	scanInProgress = true;

	try {
		let trackedUsers;
		try {
			trackedUsers = await TrackedUser.findAll();
		} catch (error) {
			await reportError('tracker: scan aborted, could not load tracked users', error);
			return true;
		}

		console.log(`Scanning ${trackedUsers.length} tracked user(s)`);

		for (const user of trackedUsers) {
			// A failure for one user is logged and skipped so the rest of the scan still runs
			try {
				const trackedServer = await TrackedServer.findOne({
					where: {
						serverId: user.serverId
					}
				});
				if (!trackedServer?.channelId) {
					await reportWarning('tracker', `Skipping ${user.username}: no tracking channel set for server ${user.serverId}`);
					continue;
				}
				await checkForUpdates(user, trackedServer.channelId, client);
			} catch (error) {
				await reportError(`tracker: update check failed for ${user.username}`, error);
			}
		}
		return true;
	} finally {
		scanInProgress = false;
	}
}
