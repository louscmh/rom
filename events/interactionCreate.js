const { Events, Collection, MessageFlags } = require('discord.js');
const { reportError, reportWarning } = require('../functions/errorlog.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const { cooldowns } = interaction.client;
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			await reportWarning('commands', `No command matching ${interaction.commandName} was found. Is it still registered on Discord?`);
			return;
		}

		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldownDuration = 3;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

		if (timestamps.has(interaction.user.id)) {
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1_000);
				return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
			}
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		try {
			await command.execute(interaction);
		} catch (error) {
			await reportError(`/${interaction.commandName} (by ${interaction.user.username} in ${interaction.guild?.name ?? 'DMs'})`, error);
			const payload = { content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral };
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
			} catch (replyError) {
				// e.g. the interaction token expired or the reply was already acknowledged
				console.error('Could not send error reply:', replyError);
			}
		}
	},
};
