// Text helpers for a user's list entry, shared by AniList and MyAnimeList.
// Entries use these normalized statuses: watching, rewatching, completed, paused, dropped, planning

const STATUS_LABELS = {
  watching: 'Watching',
  rewatching: 'Rewatching',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
  planning: 'Plan to watch',
};

// Display order for lists of entries; people actively watching come first
const STATUS_ORDER = ['watching', 'rewatching', 'paused', 'completed', 'dropped', 'planning'];

function statusLabel(status) {
  return STATUS_LABELS[status] ?? 'Unknown';
}

// e.g. "12/26", or "12/?" while the total episode count is unknown
function formatProgress(progress, totalEpisodes) {
  return `${progress ?? 0}/${totalEpisodes ?? '?'}`;
}

// AniList score given on the 100-point scale, shown in the user's own scoring format.
// Returns null for 0, which means unscored.
function formatAniListScore(score100, scoreFormat) {
  if (!score100) return null;
  switch (scoreFormat) {
    case 'POINT_10_DECIMAL':
      return `${(score100 / 10).toFixed(1)}/10`;
    case 'POINT_10':
      return `${Math.round(score100 / 10)}/10`;
    case 'POINT_5':
      return `${Math.round(score100 / 20)}/5`;
    case 'POINT_3':
      // Smiley scale: AniList stores these around 35, 60 and 85
      return score100 < 48 ? '🙁' : score100 < 73 ? '😐' : '🙂';
    default:
      return `${score100}/100`;
  }
}

// MAL scores are always whole numbers out of 10; 0 means unscored
function formatMalScore(score) {
  return score ? `${score}/10` : null;
}

module.exports = {
  STATUS_ORDER,
  statusLabel,
  formatProgress,
  formatAniListScore,
  formatMalScore,
};
