const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Shows Yes/No buttons on an already deferred reply and waits for the command user to click.
// Returns true (Yes), false (No) or null (no answer in time). The caller updates the reply afterwards.
async function askConfirmation(interaction, { content = '', embeds = [], time = 30_000 } = {}) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('yes_button')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('no_button')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger),
    );

  const message = await interaction.editReply({ content, embeds, components: [row] });

  let click;
  try {
    click = await message.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time });
  } catch {
    return null;
  }
  // Acknowledge the click so Discord doesn't show "This interaction failed"
  await click.deferUpdate();
  return click.customId === 'yes_button';
}

module.exports = {
  askConfirmation,
};
