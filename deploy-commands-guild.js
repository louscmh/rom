const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

// Optional: deploy a single command file, e.g. `node deploy-commands-guild.js anime.js`
const targetFileName = process.argv[2];

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = !targetFileName
		? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
		: fs.readdirSync(commandsPath).filter(file => file === targetFileName);
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		if (targetFileName) {
			if (commands.length === 0) {
				console.log(`No command file named ${targetFileName} was found.`);
				return;
			}
			// Posting a command with an existing name updates it in place and leaves other commands untouched
			for (const command of commands) {
				await rest.post(Routes.applicationGuildCommands(clientId, guildId), { body: command });
				console.log(`Successfully deployed command: ${command.name}`);
			}
		} else {
			// The put method is used to fully refresh all commands in the guild with the current set
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
			const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		}
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
