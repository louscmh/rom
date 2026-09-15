const { anilist } = require('./client.js');

// All queries throw AniListError when the request fails. Lookups of a single user or entry
// return null instead when AniList answers 404 (doesn't exist, or is private).

const MEDIA_FIELDS = `
  id
  idMal
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
  studios(isMain: true) {
    nodes {
      name
    }
  }
`;

async function nullIfNotFound(promise) {
  try {
    return await promise;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// One page of search results: { media: [...] }. Adult titles are excluded.
async function searchAnime(search, page = 1, perPage = 3) {
  const data = await anilist.query(`
    query ($search: String!, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `, { search, page, perPage });
  return data.Page;
}

// Number of search results (AniList's default page size caps this)
async function countAnimeSearch(search) {
  const data = await anilist.query(`
    query ($search: String!) {
      Page {
        media(search: $search, type: ANIME, isAdult: false) {
          id
        }
      }
    }
  `, { search });
  return data.Page.media.length;
}

// Profile with stats, or null if no public profile has that name
async function getUserByName(name) {
  return nullIfNotFound(anilist.query(`
    query ($name: String) {
      User(name: $name) {
        id
        name
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
  `, { name }).then((data) => data.User));
}

// Latest anime list activities, newest first
async function getUserActivities(userId, page = 1, perPage = 9) {
  const data = await anilist.query(`
    query ($userId: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        activities(userId: $userId, sort: [ID_DESC], type: ANIME_LIST) {
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
                native
              }
              coverImage {
                large
              }
              episodes
              seasonYear
              season
              genres
              meanScore
              siteUrl
              id
            }
          }
        }
      }
    }
  `, { userId, page, perPage });
  return data.Page.activities ?? [];
}

// { score } of a user's list entry, or null if it's not on their list or the list is private
async function getAnimeScore(mediaId, userId) {
  return nullIfNotFound(anilist.query(`
    query ($userId: Int, $mediaId: Int) {
      MediaList(userId: $userId, mediaId: $mediaId) {
        score
      }
    }
  `, { userId: Number(userId), mediaId }).then((data) => data.MediaList));
}

// A user's list entry: { status, progress, score, user: { mediaListOptions: { scoreFormat } } },
// with score always on the 100-point scale. Null if it's not on their list or the list is private.
async function getMediaListEntry(mediaId, userId) {
  return nullIfNotFound(anilist.query(`
    query ($userId: Int, $mediaId: Int) {
      MediaList(userId: $userId, mediaId: $mediaId) {
        status
        progress
        score(format: POINT_100)
        user {
          mediaListOptions {
            scoreFormat
          }
        }
      }
    }
  `, { userId: Number(userId), mediaId }).then((data) => data.MediaList));
}

module.exports = {
  searchAnime,
  countAnimeSearch,
  getUserByName,
  getUserActivities,
  getAnimeScore,
  getMediaListEntry,
};
