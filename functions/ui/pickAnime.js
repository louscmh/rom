const { escapeMarkdown } = require('discord.js');
const { searchAnime, countAnimeSearch } = require('../anilist/queries.js');
const { buildSearchPage } = require('../embeds/anime.js');

const PER_PAGE = 3;
const PICK_TIMEOUT = 45_000;
const UNAVAILABLE_TEXT = 'Could not reach AniList right now. Please try again in a moment.';

// Searches AniList and lets the command user pick one result with buttons, on an already deferred reply.
// Returns the chosen anime, or null when there were no results, AniList failed, or nothing was picked in time.
// When it returns null the reply has already been updated to explain why.
async function pickAnime(interaction, search) {
  let total;
  let page;
  try {
    [total, page] = await Promise.all([countAnimeSearch(search), searchAnime(search, 1, PER_PAGE)]);
  } catch (error) {
    console.error(`AniList search failed for "${search}":`, error.message);
    await interaction.editReply({ content: UNAVAILABLE_TEXT, embeds: [], components: [] });
    return null;
  }

  if (page.media.length === 0) {
    await interaction.editReply({
      content: `No anime found for **${escapeMarkdown(search)}**. Check the spelling and try again.`,
      embeds: [],
      components: [],
      allowedMentions: { parse: [] },
    });
    return null;
  }

  // A single match needs no picking
  if (page.media.length === 1 && total <= 1) {
    return page.media[0];
  }

  let pageNumber = 1;
  let message = await interaction.editReply({ content: 'Displaying search results:', ...buildSearchPage(page, pageNumber, total, PER_PAGE) });

  while (true) {
    let click;
    try {
      click = await message.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: PICK_TIMEOUT });
    } catch {
      // Timed out: keep the results visible but remove the buttons
      await interaction.editReply({ components: [] });
      return null;
    }
    await click.deferUpdate();

    if (click.customId === 'left_button' || click.customId === 'right_button') {
      pageNumber += click.customId === 'right_button' ? 1 : -1;
      try {
        page = await searchAnime(search, pageNumber, PER_PAGE);
      } catch (error) {
        console.error(`AniList search failed for "${search}" (page ${pageNumber}):`, error.message);
        await interaction.editReply({ content: UNAVAILABLE_TEXT, embeds: [], components: [] });
        return null;
      }
      message = await interaction.editReply({ content: 'Displaying search results:', ...buildSearchPage(page, pageNumber, total, PER_PAGE) });
    } else if (click.customId.startsWith('anime_')) {
      return page.media[Number(click.customId.slice('anime_'.length)) - 1];
    }
  }
}

module.exports = {
  pickAnime,
};
