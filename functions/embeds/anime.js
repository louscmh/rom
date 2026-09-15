const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { titleOf, seasonText, genresText, releaseFooterText } = require('../format/media.js');

// Full details of one anime, as shown by /anime.
// malMean: MyAnimeList's average score out of 10, or null if unavailable
function buildAnimeEmbed(media, { malMean = null } = {}) {
  return new EmbedBuilder()
    .setAuthor({
      name: titleOf(media),
      url: media.siteUrl,
    })
    // Lines are joined instead of using a multi-line template string, whose source
    // indentation would show up as leading whitespace on mobile
    .setDescription([
      `• **Average Score:** ${media.meanScore ?? 'N.A'}/100 (ANI), ${malMean ?? 'N.A'}/10 (MAL)`,
      `• **Episodes:** ${media.episodes ?? 'Not Released'}`,
      `• **Released in:** ${seasonText(media) ?? 'N.A'}`,
      `• **Genres:** ${genresText(media)}`,
      `• **Main Studio:** ${media.studios?.nodes?.[0]?.name ?? 'N.A'}`,
      `• **Format:** ${media.format ?? 'N.A'}`,
    ].join('\n'))
    .setThumbnail(media.coverImage?.large ?? null)
    .setColor('#00b0f4')
    .setFooter({
      text: `${media.favourites} ❤️ ${media.popularity} 👀`,
    })
    .setTimestamp();
}

function pageButton(customId, label) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary);
}

// One page of search results: an embed per anime, plus buttons to pick one or change page.
// Button ids: 'left_button', 'right_button', and 'anime_<position on this page, from 1>'
function buildSearchPage(page, pageNumber, total, perPage) {
  const offset = (pageNumber - 1) * perPage;
  const row = new ActionRowBuilder();

  if (pageNumber > 1) {
    row.addComponents(pageButton('left_button', '<'));
  }

  const embeds = page.media.map((media, i) => {
    row.addComponents(pageButton(`anime_${i + 1}`, `${offset + i + 1}`));
    return new EmbedBuilder()
      .setAuthor({
        name: `Result ${offset + i + 1}/${total}`,
      })
      .setTitle(titleOf(media))
      .setThumbnail(media.coverImage?.large ?? null)
      .setColor('#00b0f4')
      .addFields(
        { name: 'Community Score', value: `${media.meanScore ?? 'N.A'}/100`, inline: true },
        { name: 'Episodes', value: `${media.episodes ?? 'N.A'}`, inline: true },
        { name: 'Genres', value: genresText(media), inline: false },
      )
      .setFooter({
        text: releaseFooterText(media),
      });
  });

  if (offset + page.media.length < total) {
    row.addComponents(pageButton('right_button', '>'));
  }

  // Discord rejects an action row without buttons
  return { embeds, components: row.components.length > 0 ? [row] : [] };
}

module.exports = {
  buildAnimeEmbed,
  buildSearchPage,
};
