import { ActionRowBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji, ButtonStyle, ButtonBuilder, ComponentBuilder, AnyComponentBuilder } from "discord.js";

export enum ButtonEmojis {
    Rock = "🪨",
    Paper = "📄",
    Scissors = "✂️",
    Deny = "❌",
    Accept = "✅",
}

const DefaultButtonsObject = {
    Rock: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(ButtonEmojis.Rock)
        .setLabel("Rock"),
    Paper: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(ButtonEmojis.Paper)
        .setLabel("Paper"),
    Scissors: new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(ButtonEmojis.Scissors)
        .setLabel("Scissors"),
    Deny: new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setEmoji(ButtonEmojis.Deny)
        .setLabel("Deny"),
    Accept: new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setEmoji(ButtonEmojis.Accept)
        .setLabel("Accept")
};

export enum DefaultButtons {
    Rock = "Rock",
    Paper = "Paper",
    Scissors = "Scissors",
    Deny = "Deny",
    Accept = "Accept"
}

function formatEmoji(emoji: string): APIMessageComponentEmoji {
    if (isNaN(Number(emoji))) {
        return {
            name: emoji
        }
    } else if(!isNaN(Number(emoji))) {
        return {
            id: emoji
        }
    } else {
        return null;
    }
}
export function generateButton(baseButton: DefaultButtons, customId: string, label?: string, emoji?: string) {
    const button = DefaultButtonsObject[baseButton];
    const style = button.toJSON().style;
    if (label == null && emoji == null) {
        return DefaultButtonsObject[baseButton];
    } else {
        return new ButtonBuilder()
            .setLabel(label)
            .setCustomId(customId)
            .setStyle(style)
            .setEmoji(formatEmoji(emoji));
    }
}

export function createActionRow(...buttons: AnyComponentBuilder[]) {
    return new ActionRowBuilder()
        .addComponents(buttons);
}