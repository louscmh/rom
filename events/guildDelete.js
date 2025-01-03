const { Events } = require('discord.js');
const { TrackedServer, TrackedUser } = require('./ready.js'); // Adjust the path based on your project structure

module.exports = {
	name: Events.GuildDelete,
	execute(guild) {
		(async () => {
            try {
                console.log(`Removed from a guild: ${guild.name} (${guild.id})`);
        
                const deletedServer = await TrackedServer.destroy({
                    where: { serverId: guild.id },
                });
                const deletedUsers = await TrackedUser.destroy({
                    where: { serverId: guild.id },
                });

                if (deletedServer) {
                    console.log(`TrackedServer entry deleted for ${guild.name} (${guild.id})`);
                } else {
                    console.log(`No entry found in TrackedServer for ${guild.name} (${guild.id})`);
                }

                if (deletedUsers) {
                    console.log(`TrackedUser entries deleted for ${guild.name} (${guild.id})`);
                } else {
                    console.log(`No entry found in TrackedUser for ${guild.name} (${guild.id})`);
                }
            } catch (error) {
                console.error(`Failed to delete entry for guild ${guild.name} (${guild.id}):`, error);
            }
		})();
	},
};