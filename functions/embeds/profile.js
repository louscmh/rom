const { EmbedBuilder } = require('discord.js');

// AniList profile summary, from getUserByName()
function buildProfileEmbed(user) {
  return new EmbedBuilder()
    .setColor(0x1E90FF)
    .setTitle(`${user.name}'s Profile`)
    .setThumbnail(user.avatar?.large ?? null)
    .addFields(
      { name: 'Anime Watched', value: `${user.statistics.anime.count}`, inline: true },
      { name: 'Mean Anime Score', value: `${user.statistics.anime.meanScore ?? 'N/A'}`, inline: true },
      { name: 'Manga Read', value: `${user.statistics.manga.count}`, inline: true },
      { name: 'Mean Manga Score', value: `${user.statistics.manga.meanScore ?? 'N/A'}`, inline: true },
    )
    .setFooter({ text: 'Data provided by AniList' })
    .setTimestamp();
}

// MyAnimeList profile summary. MAL doesn't expose other users' profiles, so the stats are
// worked out from their list, from getMalAnimeList()
function buildMalProfileEmbed(username, entries) {
  const statuses = [...entries.values()];
  const scores = statuses.map((entry) => entry.score).filter((score) => score > 0);
  const meanScore = scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : 'N/A';

  return new EmbedBuilder()
    .setColor(0x2E51A2)
    .setTitle(`${username}'s Profile`)
    .setURL(`https://myanimelist.net/profile/${encodeURIComponent(username)}`)
    .addFields(
      { name: 'Anime on List', value: `${statuses.length}`, inline: true },
      { name: 'Completed', value: `${statuses.filter((entry) => entry.status === 'completed').length}`, inline: true },
      { name: 'Mean Anime Score', value: `${meanScore}`, inline: true },
    )
    .setFooter({ text: 'Data provided by MyAnimeList' })
    .setTimestamp();
}

module.exports = {
  buildProfileEmbed,
  buildMalProfileEmbed,
};
