async function searchanimebytitle(anime, page = 1) {
  const url = 'https://graphql.anilist.co';

  const query = `
    query ($search: String!, $page: Int, $perPage: Int = 3) {
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
  let finalString = "";
  let finalEmbeds = [];

	for (let i = numEmbed - 1; i >= 0; i--) {
		let anime = animedata.media[i];
    const embed = new EmbedBuilder()
    .setAuthor({
      name: `Result ${numPage*numEmbed+i+1}/${maxLength}`,
    })
    .setTitle(anime.title.english != null ? anime.title.english : anime.title.romaji)
    // .setURL("https://example.com")
    .addFields(
      {
        name: "**                                                                                                                                          **",
        value: "",
        inline: false
      },
    )
    .setThumbnail(anime.coverImage.large)
    .setColor("#00b0f4")
    .setFooter({
      text: `Released in ${anime.season} ${anime.seasonYear}`,
    });
    }
}


// Export the function
module.exports = {
  searchanimebytitle,
  getanimesearchlength,
};
