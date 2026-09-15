// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { setClient, reportError } = require('./functions/errorlog.js');
const { syncDatabase } = require('./functions/db/models.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
setClient(client);

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	// Log errors from any handler instead of letting them become unhandled rejections
	const run = (...args) => Promise.resolve()
		.then(() => event.execute(...args))
		.catch(error => reportError(`event ${event.name}`, error));
	if (event.once) {
		client.once(event.name, run);
	} else {
		client.on(event.name, run);
	}
}

client.on(Events.Error, error => reportError('client error', error));
process.on('unhandledRejection', error => reportError('unhandledRejection', error));

(async () => {
	// Make sure the tables exist before any command or scan touches them
	try {
		await syncDatabase();
	} catch (error) {
		console.error('Database sync failed, not starting the bot:', error);
		process.exit(1);
	}

	try {
		await client.login(token);
	} catch (error) {
		console.error('Login failed, check the token in config.json:', error);
		process.exit(1);
	}
})();
