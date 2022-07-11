import { ButtonInteraction, ChatInputCommandInteraction, Interaction, InteractionReplyOptions, InteractionResponse, Message, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js";

export type Repliable = ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction | ChatInputCommandInteraction;

//Probably going to get deprecated
//We need something better than this
//  WHAT IS THIS?
// ‾‾‾‾‾‾‾‾‾‾‾‾‾‾
//This handles the message/interaction provided
//e.g. If they provide a message will use the message.channel.send() function
//If they provide an interaction will use the interaction.reply() function
export class InteractionManager {
    private replied: InteractionResponse<boolean>;

    isInteraction(interaction: any): interaction is Interaction {
        return interaction instanceof Interaction;
    }

    isRepliable(interaction: any): interaction is Repliable {
        return interaction instanceof ButtonInteraction ||
            interaction instanceof SelectMenuInteraction ||
            interaction instanceof ModalSubmitInteraction ||
            interaction instanceof ChatInputCommandInteraction;
    }

    async reply(interaction: Interaction, options: InteractionReplyOptions){
        if(!this.isRepliable(interaction)) return;
        
        const repliedInteraction = await interaction.reply(Object.assign({
            fetchReply: true
        }, options));

        this.replied = repliedInteraction;
        return repliedInteraction;
    }
}