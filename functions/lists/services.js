// The list services a tracked user can belong to, keyed by the value stored in TrackedUser.service
const SERVICES = {
  anilist: {
    name: 'AniList',
    tag: 'ANI',
    profileUrl: (username) => `https://anilist.co/user/${encodeURIComponent(username)}`,
  },
  mal: {
    name: 'MyAnimeList',
    tag: 'MAL',
    profileUrl: (username) => `https://myanimelist.net/profile/${encodeURIComponent(username)}`,
  },
};

// Unknown or missing values fall back to AniList, the only service before this column existed
function getService(key) {
  return SERVICES[key] ?? SERVICES.anilist;
}

module.exports = {
  SERVICES,
  getService,
};
