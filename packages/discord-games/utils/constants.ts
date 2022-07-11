import { EmbedAuthorData } from "discord.js";
import { generateId } from "./Id";

export const meta = {
    name: "Discord-Games",
    description: "Discord-Games is a collection of Discord games.",
    websiteURL: "https://docs.trtle.xyz/packages/discord-games/intro",
    iconURL: `unknown`
}

interface DefaultOptions {
    URL: EmbedAuthorData;
}

export const Options: DefaultOptions = {
    URL: {
        url: meta.websiteURL,
        iconURL: meta.iconURL,
        name: `Powered by ${meta.name}`
    }
};