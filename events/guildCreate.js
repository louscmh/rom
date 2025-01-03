const { Events } = require('discord.js');
const { TrackedServer } = require('./ready.js'); // Adjust the path based on your project structure

module.exports = {
	name: Events.GuildCreate,
	execute(guild) {
		(async () => {
            try {
                console.log(`Joined a new guild: ${guild.name} (${guild.id})`);

                const defaultChannel = guild.channels.cache.find(
                    (channel) =>
                        channel.type === 0 && // Text channel
                        channel.permissionsFor(guild.members.me).has('SendMessages')
                );

                const serverId = guild.id;
                const channelId = defaultChannel ? defaultChannel.id : null;

                await TrackedServer.create({ serverId, channelId });
                console.log(`TrackedServer entry created for ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to initialize entry for guild ${guild.name} (${guild.id}):`, error);
            }
		})();
	},
};