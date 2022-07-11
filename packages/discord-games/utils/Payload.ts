import { AnyComponentBuilder, EmbedBuilder, InteractionReplyOptions } from "discord.js";
import { createActionRow } from "./Button";

interface PayloadOptions {
    embeds?: EmbedBuilder[];
    content?: string;
    ephemeral?: boolean;
    mentions?: "ALL" | "NONE";
}

function elseValue(value: any, defaultValue: any){
    if(value == null) return defaultValue;
    return value;
}

export class Payload {
    content: string;
    embeds: EmbedBuilder[] = [];
    ephemeral: boolean = false;
    mentions: "ALL" | "NONE";

    constructor(private options: PayloadOptions = {}){
        this.content = elseValue(options.content, null);
        this.embeds = elseValue(options.embeds, []);
        this.ephemeral = elseValue(options.ephemeral, false);
        this.mentions = elseValue(options.mentions, "NONE");
    }

    getOptions(): PayloadOptions {
        return {
            content: this.content,
            embeds: this.embeds,
            ephemeral: this.ephemeral,
            mentions: this.mentions
        }
    }
}

export class DeveloperPayload extends Payload {
    components: AnyComponentBuilder[] = [];

    constructor(options: PayloadOptions = {}){
        super(options);
    }

    setComponents(components: AnyComponentBuilder[]){
        this.components = components;
    }

    toJSON(): InteractionReplyOptions {
        return {
            content: this.content,
            embeds: this.embeds,
            ephemeral: this.ephemeral,
            allowedMentions: this.mentions == "ALL" ? null : {
                parse: ["everyone", "roles", "users"]
            },
            components: [
                //This may be a Discord.js typings error
                //We're just going to ignore it
                //@ts-ignore
                createActionRow(
                    ...this.components
                )
            ]
        }
    }
}

export function resolvePayload(payload: Payload, defaultValue: Payload){
    if(payload == null) return new DeveloperPayload(defaultValue.getOptions());
    return new DeveloperPayload(payload.getOptions());
}