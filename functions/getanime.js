const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { TrackedUser } = require('../events/ready.js'); // Adjust the path based on your project structure
const { getanimescore } = require('./anilist.js'); // Adjust the path based on your project structure

async function searchanimebytitle(anime, page = 1) {
  const url = 'https://graphql.anilist.co';

  const query = `
    query ($search: String!, $page: Int, $perPage: Int = 3, $isMain: Boolean=true) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME) {
        id
        title {
          english
          romaji
        }
        seasonYear
        season
        coverImage {
          large
        }
        episodes
        siteUrl
        genres
        format
        favourites
        popularity
        meanScore
        rankings {
          rank
          type
          format
          year
          season
        }
        studios(isMain: $isMain) {
          nodes {
            name
          }
        }
      }
    }
  }
  `;

  const variables = {
    search: anime,
    page: page,
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
      return data.data.Page; 
    } else {
      console.error('Error:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

async function getanimesearchlength(anime) {
  const url = 'https://graphql.anilist.co';

  const query = `
    query ($search: String!) {
    Page {
      media(search: $search, type: ANIME) {
        id
      }
    }
  }
  `;

  const variables = {
    search: anime,
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
      return data.data.Page.media.length; 
    } else {
      console.error('Error:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

async function getsearchembed(animedata, numEmbed, numPage, maxLength) {
  let finalEmbeds = [];
  let embed = new EmbedBuilder()
  let buttons = new ActionRowBuilder()

  if (numPage != 1) {
    buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId('left_button')
                    .setLabel('<')
                    .setStyle(ButtonStyle.Secondary));
  }

	for (let i = 0; i < numEmbed; i++) {
    let anime = animedata.media[i];
    const embed = new EmbedBuilder()
    .setAuthor({
      name: `Result ${((numPage-1)*3)+i+1}/${maxLength}`,
    })
    .setTitle(anime.title.english != null ? anime.title.english : anime.title.romaji)
    .setThumbnail(anime.coverImage.large)
    .setColor("#00b0f4")
    .addFields(
      { name: 'Community Score', value: `${anime.meanScore}/100`, inline: true },
      { name: 'Episodes', value: `${anime.episodes}`, inline: true },
      { name: 'Genres', value: `${anime.genres.length == 0 ? "N.A" : anime.genres.length > 1 ? anime.genres.join(", ") : anime.genres[0]}`, inline: false },
    )
    .setFooter({
      text: anime.season != null ? `Released in ${anime.season.charAt(0).toUpperCase() + anime.season.slice(1).toLowerCase()} ${anime.seasonYear} · ${anime.siteUrl}` : `No season data · ${anime.siteUrl}`,
    });
    finalEmbeds.push(embed);
    buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`anime_${i+1}`)
                    .setLabel(`${((numPage-1)*3)+i+1}`)
                    .setStyle(ButtonStyle.Secondary));
  }
  if (maxLength-(numPage*numEmbed)>0 && !(numEmbed < 3)) {
    buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId('right_button')
                    .setLabel('>')
                    .setStyle(ButtonStyle.Secondary));
  }

  return [finalEmbeds, buttons]
}

async function createanimeembed(anime,compareUser) {
  try {
    let embed = new EmbedBuilder()
    .setAuthor({
      name: anime.title.english != null ? anime.title.english : anime.title.romaji,
      url: anime.siteUrl,
    })
    .setDescription(`• **Average Score:** ${anime.meanScore ?? "N.A"}/100
      • **Episodes:** ${anime.episodes ?? "Not Released"}
      ${anime.season == null ? `• **Released in:** N.A` : `• **Released in:** ${anime.season.charAt(0).toUpperCase() + anime.season.slice(1).toLowerCase()} ${anime.seasonYear}`}
      • **Genres:** ${anime.genres.length == 0 ? "N.A" : anime.genres.length > 1 ? anime.genres.join(", ") : anime.genres[0]}
      • **Main Studio:** ${anime.studios.nodes.length > 0 ? anime.studios.nodes[0].name : "N.A"}
      • **Format:** ${anime.format ?? "N.A"}`)
    .setThumbnail(anime.coverImage.large)
    .setColor("#00b0f4")
    .setFooter({
      text: `${anime.favourites} ❤️ ${anime.popularity} 👀`,
    })
    .setTimestamp();

    if (compareUser != null) {
      let userString = "";
      
      const trackedUsers = await TrackedUser.findAll({
        where: {
          serverId: compareUser
        }
      });

      for (let i = 0; i <= trackedUsers.length - 1; i++) {
        let user = trackedUsers[i];
        let userScore = await getanimescore(anime.id,user.userId);
        if (userScore.score != 0 && userScore.score != null) {
          userString += `${user.username} - \`${userScore.score}/${userScore.score < 11 ? 10 : 100}\`\n`
        }
      }

      if (userString != "") {
        embed.addFields(
          {
            name: "Server Scores",
            value: userString,
            inline: true
          }
        )
      }
    }
    // embed.addFields(
    //   {
    //     name: "Rankings",
    //     value: `• Rating: #${anime.rankings[]} (2016), #12 (Season)\n• Popularity: #56 (2016), #18 (Season)`,
    //     inline: false
    //   }
    // )

    return embed;
  } catch (e) {
    console.error('Error fetching data:', e);
    return [];
  }
}

// Export the function
module.exports = {
  searchanimebytitle,
  getanimesearchlength,
  getsearchembed,
  createanimeembed,
};
