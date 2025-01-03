const fetch = require('node-fetch');

async function getUserActivities(userId, page = 1, perPage = 9) {
  const url = 'https://graphql.anilist.co';

  const query = `
    query Query($userId: Int, $sort: [ActivitySort], $type: ActivityType, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        activities(userId: $userId, sort: $sort, type: $type) {
          ... on ListActivity {
            id
            userId
            type
            status
            progress
            createdAt
            user {
              name
              id
            }
            media {
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
              episodes
            }
          }
        }
      }
    }
  `;

  const variables = {
    userId: userId,
    sort: ["ID_DESC"], // Fetch latest activities first
    type: "ANIME_LIST", // Filter for list activities
    page: page,
    perPage: perPage,
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
      return data.data.Page.activities; // Return activities
    } else {
      console.error('Error:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

async function getUserActivity(username) {
  const url = 'https://graphql.anilist.co';
  
  const query = `
    query ($name: String) {
      User(name: $name) {
        id
        name
        activities {
          ... on ListActivity {
            id
            status
            progress
            media {
              title {
                romaji
                english
              }
            }
            createdAt
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
      return data.data.User.activities; // Return activity list
    } else {
      console.error('Error:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

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
      // console.log(data.data.User);
      return data.data.User;
    } else {
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Export the function
module.exports = {
  getUserActivity,
  getUserData,
  getUserActivities,
};
