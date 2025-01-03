const fetch = require('node-fetch'); // Use this in Node.js. In the browser, `fetch` is built-in.

async function getUserData(username) {
  const url = 'https://graphql.anilist.co';
  
  const query = `
    query ($name: String) {
      User(name: $name) {
        id
        name
        about
        avatar {
          large
        }
        statistics {
          anime {
            count
            meanScore
          }
          manga {
            count
            meanScore
          }
        }
      }
    }
  `;

  const variables = {
    name: username,
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(data.data.User);
      return data.data.User;
    } else {
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getuseranilistinfo')
        .setDescription('Get Anilist info of a specified username!')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The username specified')
				.setRequired(true)),
    async execute(interaction) {
      const username = interaction.options.getString('user', true);
      const data = await getUserData(username)
      await interaction.reply(`\`\`\`
        ${JSON.stringify(data, null, 2)}
        \`\`\``);
    }
}