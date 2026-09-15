// Text helpers shared by every embed that shows an anime

function titleOf(media) {
  return media.title?.english ?? media.title?.romaji ?? media.title?.native ?? 'Unknown title';
}

// e.g. "Spring 1998", or null if AniList has no season data
function seasonText(media) {
  if (media.season == null) return null;
  return `${media.season.charAt(0).toUpperCase() + media.season.slice(1).toLowerCase()} ${media.seasonYear}`;
}

function genresText(media) {
  return media.genres?.length ? media.genres.join(', ') : 'N.A';
}

// Footer used by search results and tracker updates
function releaseFooterText(media) {
  const season = seasonText(media);
  return season != null ? `Released in ${season} · ${media.siteUrl}` : `No season data · ${media.siteUrl}`;
}

module.exports = {
  titleOf,
  seasonText,
  genresText,
  releaseFooterText,
};
