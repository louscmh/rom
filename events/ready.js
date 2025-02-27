const { EmbedBuilder, Events } = require('discord.js');
const POLL_INTERVAL = 300000; // 5 minutes
const { getUserActivities, getUserData, getanimescore } = require('../functions/anilist.js'); // Import the function from anilist.js
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

TrackedUser.sync({ alter: true })
	.then(() => console.log('TrackedUser table synchronized'))
	.catch(console.error);

TrackedServer.sync({ alter: true })
	.then(() => console.log('TrackedServer table synchronized'))
	.catch(console.error);

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
};

async function checkForUpdates(user, channelId, client) {
	console.log("Update check initiated");
	console.log(`User: ${user.username}`);
	const userdata = await getUserData(user.username);
	const userId = userdata.id;
	const avatar = userdata.avatar.large;
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
		await delay(1000);
		// console.log(latestActivity.media.id);
		let animedata = await getanimescore(latestActivity.media.id, userId)
		// console.log(animedata);

		if (i == 0) {
			user.lastReadActivity = latestActivity.createdAt;
			await user.save();
		}

		if (latestActivity.status == "watched episode" && latestActivity.createdAt != null) {
			// console.log(latestActivity);
			
			let embed = new EmbedBuilder()
				.setAuthor({
				name: latestActivity.media.title.english ?? latestActivity.media.title.romaji ?? latestActivity.media.title.native,
				url: latestActivity.media.siteUrl,
				})
				.setColor(0x1E90FF)
				.setThumbnail(latestActivity.media.coverImage.large)
				.setTitle(latestActivity.progress.includes("-") ? "Watched episodes" : "Watched an episode")
				.setDescription(
				`• **Average Score:** ${latestActivity.media.meanScore ?? "N.A"}/100
				• **Episodes:** ${latestActivity.progress}/${latestActivity.media.episodes ?? "N.A"}
				• **Genres:** ${latestActivity.media.genres.length == 0 ? "N.A" : latestActivity.media.genres.length > 1 ? latestActivity.media.genres.join(", ") : latestActivity.media.genres[0]}`)
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
				.setThumbnail(latestActivity.media.coverImage.large)
				.setTitle("Completed Anime")
				.setDescription(
				`• **Average Score:** ${latestActivity.media.meanScore}/100
				• **Score Given:** ${animedata.score}
				• **Episodes:** ${latestActivity.media.episodes}/${latestActivity.media.episodes}
				• **Genres:** ${latestActivity.media.genres.length == 0 ? "N.A" : latestActivity.media.genres.length > 1 ? latestActivity.media.genres.join(", ") : latestActivity.media.genres[0]}`)
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
				.setThumbnail(latestActivity.media.coverImage.large) 
				.setTitle("Plan to watch")
				.setDescription(
				`• **Average Score:** ${latestActivity.media.meanScore ?? "N.A"}/100
				• **Episodes:** 0/${latestActivity.media.episodes ?? "N.A"}
				• **Genres:** ${latestActivity.media.genres.length == 0 ? "N.A" : latestActivity.media.genres.length > 1 ? latestActivity.media.genres.join(", ") : latestActivity.media.genres[0]}`)
				.addFields(
					{ name: 'Time of Activity', value: `<t:${Math.floor(latestActivity.createdAt)}:R>`, inline: false },
				)
				.setFooter({
					text: latestActivity.media.season != null ? `Released in ${latestActivity.media.season.charAt(0).toUpperCase() + latestActivity.media.season.slice(1).toLowerCase()} ${latestActivity.media.seasonYear} · ${latestActivity.media.siteUrl}` : `No season data · ${latestActivity.media.siteUrl}`,
				});
			finalEmbeds.push(embed);
		}
	}

	console.log(`channel id to send: ${channelId}`)
	const channel = await client.channels.fetch(channelId);
	await channel.send({ content: "", embeds: finalEmbeds, components: [] });
	await channel.send({ content: "** **", embeds: [], components: [] });
	console.log(`Update for ${user.username} performed`);

}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scan(client) {
	
	TrackedUser.sync({ alter: true })
	.catch(console.error);

	TrackedServer.sync({ alter: true })
	.catch(console.error);

	const trackedUsers = await TrackedUser.findAll();

	console.log(`users: ${JSON.stringify(trackedUsers)}`);

	for (let i = 0; i <= trackedUsers.length - 1; i++) {
		console.log("Initial check happened");
		let user = trackedUsers[i];
		const trackedServer = await TrackedServer.findOne({
			where: {
				serverId: user.serverId
			}
		});
		let channelId = trackedServer.channelId
		JSON.stringify(user, null, 2)
		await checkForUpdates(user, channelId, client);
	}
}
