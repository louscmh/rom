const { getMediaListEntry } = require('../anilist/queries.js');
const { getMalAnimeList } = require('../mal/queries.js');
const { formatAniListScore, formatMalScore } = require('../format/entry.js');

const ANILIST_STATUSES = {
  CURRENT: 'watching',
  REPEATING: 'rewatching',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  DROPPED: 'dropped',
  PLANNING: 'planning',
};

const MAL_STATUSES = {
  watching: 'watching',
  completed: 'completed',
  on_hold: 'paused',
  dropped: 'dropped',
  plan_to_watch: 'planning',
};

// A tracked user's list entry for an anime (from AniList search results), in the same shape for both services:
// { status, progress, scoreText }, where status is normalized (see format/entry.js) and scoreText is null if unscored.
// Returns null if the anime isn't on their list. Throws if the user's service can't be reached.
async function getServerEntry(trackedUser, media) {
  if (trackedUser.service === 'mal') {
    // Anime that only exist on AniList can't be matched to a MAL list
    if (!media.idMal) return null;
    const entry = (await getMalAnimeList(trackedUser.userId)).get(media.idMal);
    if (!entry) return null;
    return {
      // MAL marks a rewatch as a flag rather than a status
      status: entry.is_rewatching ? 'rewatching' : MAL_STATUSES[entry.status],
      progress: entry.num_episodes_watched,
      scoreText: formatMalScore(entry.score),
    };
  }

  const entry = await getMediaListEntry(media.id, trackedUser.userId);
  if (!entry) return null;
  return {
    status: ANILIST_STATUSES[entry.status],
    progress: entry.progress,
    scoreText: formatAniListScore(entry.score, entry.user?.mediaListOptions?.scoreFormat),
  };
}

module.exports = {
  getServerEntry,
};
