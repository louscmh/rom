const { mal } = require('./client.js');

// A user's whole list is fetched at once (MAL has no single-entry lookup for other users),
// so it's cached briefly to avoid refetching it for every /anime search
const LIST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 1000; // MAL's maximum
const listCache = new Map();

// A user's anime list as a Map of MAL anime id -> list_status
// ({ status, score, num_episodes_watched, is_rewatching, updated_at, ... }).
// Throws MalError, with status 404 if the user doesn't exist.
async function getMalAnimeList(username) {
  const key = username.toLowerCase();
  const cached = listCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < LIST_CACHE_TTL) {
    return cached.entries;
  }

  const entries = new Map();
  // nsfw=true: without it MAL silently leaves some entries out
  let page = await mal.get(`users/${encodeURIComponent(username)}/animelist`, { fields: 'list_status', limit: PAGE_SIZE, nsfw: true });
  while (true) {
    for (const item of page.data) {
      entries.set(item.node.id, item.list_status);
    }
    if (!page.paging?.next) break;
    page = await mal.get(page.paging.next);
  }

  listCache.set(key, { fetchedAt: Date.now(), entries });
  return entries;
}

// MAL's average score for an anime (out of 10), or null if it has none yet (e.g. unaired) or doesn't exist
async function getMalAnimeMean(malId) {
  try {
    const anime = await mal.get(`anime/${malId}`, { fields: 'mean' });
    return anime.mean ?? null;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

module.exports = {
  getMalAnimeList,
  getMalAnimeMean,
};
