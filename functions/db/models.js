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
	// 'anilist' or 'mal'. For MAL users, userId holds the lowercased username since
	// MAL's API doesn't expose other users' ids
	service: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: 'anilist',
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
	await addMissingColumns();
	console.log('Database tables synchronized');
}

// sync() won't add columns to tables that already exist, so columns added to a model later are
// added here. ADD COLUMN keeps existing rows (they get the default) and doesn't rebuild the table.
async function addMissingColumns() {
	const queryInterface = sequelize.getQueryInterface();
	const table = TrackedUser.getTableName();
	const columns = await queryInterface.describeTable(table);

	if (!columns.service) {
		await queryInterface.addColumn(table, 'service', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'anilist',
		});
		console.log(`Added "service" column to ${table}`);
	}
}

module.exports = {
	sequelize,
	TrackedUser,
	TrackedServer,
	syncDatabase,
};
