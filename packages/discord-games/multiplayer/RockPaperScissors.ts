import { Channel, CommandInteraction, Message, ActionRowBuilder, ButtonBuilder, GuildMember, User, ButtonStyle } from "discord.js";
import { timestamp as Timestamp } from "discord.js-util";
import { Options } from "../utils/constants";
import GameError, { Headers } from "../utils/Error";
import GamecordEmbed from "../OptionManager/Embed";
import GamecordPayload from "../OptionManager/Payload";
import ReplyManager from "../OptionManager/ReplyManager";
import { Payload, resolvePayload } from "../utils/Payload";
import { generateId } from "../utils/Id";
import { createActionRow, DefaultButtons, generateButton } from "../utils/Button";
import { APIButtonComponentWithCustomId } from "discord-api-types/v10";

export interface RpsButton {
    label: string;
    emoji: string;
    style: ButtonStyle;
}

export interface RpsOptions {
    RockButton: RpsButton;
    PaperButton: RpsButton;
    ScissorsButton: RpsButton;
    JoinButton: RpsButton;
    DenyButton: RpsButton;
    TimeToJoin: number;
}

export interface RpsEmbedOptions {
    /**
     * When the player wins.
     */
    WinMessage: Payload;
    /**
     * When the game is starting.
     */
    StartMessage: Payload;
    /**
     * When the user get's asked to join the game.
     */
    userInputMessage: Payload;
    /**
     * This will happen when the user tries to play with a bot.
     */
    BotMessage: Payload;
    /**
     * This will happen when the user tries to play with themselves.
     */
    YouMessage: Payload;
    /**
     * When the player loses the game.
     */
    LoseMessage: Payload;
    /**
     * When they both choose the same thing.
     */
    TieMessage: Payload;
}

export interface RpsButtons {
    Rock: ButtonBuilder;
    Paper: ButtonBuilder;
    Scissors: ButtonBuilder;
    Deny: ButtonBuilder;
    Accept: ButtonBuilder;
}

interface CustomIds {
    Rock: string;
    Paper: string;
    Scissors: string;
    Deny: string;
    Accept: string;
}

class RockPaperScissors {
    public dev: boolean;
    public User: User;
    public TimeToJoin: number;
    private customIds: CustomIds;
    public Buttons: RpsButtons;
    private Payloads: RpsEmbedOptions;

    constructor(
        User: User,
        GameOptions: RpsOptions,
        GameEmbeds: RpsEmbedOptions,
        Devlopment: boolean
    ){
        this.dev = Devlopment;

        if(!User || User?.username == null) throw new GameError(
            `Invalid User`,
            Headers.InvalidUser
        );
    
        const PrimaryStyle = "PRIMARY";
        this.User = User;
        this.TimeToJoin = GameOptions.TimeToJoin || 300000;
        const customIds = this.customIds = {
            Rock: generateId("ROCK"),
            Paper: generateId("PAPER"),
            Scissors: generateId("SCISSORS"),
            Accept: generateId("JOIN_GAME"),
            Deny: generateId("DENY_GAME")
        }

        this.Buttons = {
            Rock: generateButton(DefaultButtons.Rock, customIds.Rock, GameOptions.RockButton.label, GameOptions.RockButton.emoji),
            Paper: generateButton(DefaultButtons.Paper, customIds.Paper, GameOptions.PaperButton.label, GameOptions.PaperButton.emoji),
            Scissors: generateButton(DefaultButtons.Scissors, customIds.Scissors, GameOptions.ScissorsButton.label, GameOptions.ScissorsButton.emoji),
            Accept: generateButton(DefaultButtons.Accept, customIds.Accept, GameOptions.JoinButton.label, GameOptions.JoinButton.emoji),
            Deny: generateButton(DefaultButtons.Deny, customIds.Deny, GameOptions.DenyButton.label, GameOptions.DenyButton.emoji)
        }

        this.Payloads = {
            StartMessage: GameEmbeds.StartMessage || new GamecordPayload({
                embeds: [
                    new GamecordEmbed()
                    .setTitle(`The game has started!`)
                    .setDescription(`The RPS game has started! Please click a button.`)
                ]
            }),
            LoseMessage: GameEmbeds.LoseMessage || new GamecordPayload({
                embeds: [
                    new GamecordEmbed()
                    .setTitle(`❌ Lost!`)
                    .setDescription(`You picked {{playerPick}} and AI has picked {{aiPick}}! You lost {{playerMention}}!`)
                ]
            }),
            WinMessage: resolvePayload(GameEmbeds.WinMessage, new Payload({
                embeds: [
                    new GamecordEmbed()
                    .setTitle(`🏆 Win!`)
                    .setDescription(`You picked {{playerPick}} and AI has picked {{aiPick}}! You won {{playerMention}}!`)
                ]
            })),
            TieMessage: resolvePayload(GameEmbeds.TieMessage, new Payload({
                embeds: [
                    new GamecordEmbed()
                    .setTitle(`🪢 Tie!`)
                    .setDescription(`You picked {{playerPick}} and AI has picked {{aiPick}}! It's a tie!`)
                ]
            })),
            userInputMessage: resolvePayload(GameEmbeds.userInputMessage, new Payload({
                embeds: [
                    new GamecordEmbed()
                    .setTitle(`📥 Joining a game!`)
                    .setDescription(`{{playerMention}} wants you to join a game {{player2Mention}}!\n\n⏰ Join Timer ends: {{time}}`)
                ],
                content: `{{player2Mention}}`,
                mentions: "ALL"
            })),
            BotMessage: resolvePayload(GameEmbeds.BotMessage, new Payload({
                content: `❌ You can't play with bots!`,
                ephemeral: true
            })),
            YouMessage: resolvePayload(GameEmbeds.YouMessage, new Payload({
                content: `❌ You can't play with yourself!`,
                ephemeral: true
            }))
        }
    }

    /**
     * Starts the game.
     * @param {Channel} Channel 
     * @param {CommandInteraction} Interaction 
     * @param {Boolean} SlashCommand
     */
    async start(Channel, Interaction, SlashCommand){
        const Int = new ReplyManager(Interaction);
        const {
            Payloads,
            customIds
        } = this;

        if((!Interaction || !Interaction.isCommand()) && Int.isInteraction()) throw new GameError(
            `Interaction must be a command interaction.`,
            GameError.Errors.INVALID_INTERACTION
        );
        if(!Channel || !Channel?.isText()) throw new GameError(
            `Channel must be a text channel.`,
            GameError.Errors.INVALID_CHANNEL
        );

        if(this.User.bot){
            const BotPayload = Payloads.BotMessage
            .toJSON();

            await Int.reply(BotPayload)
            return;
        }

        if((this.User.id == Int.User.id) && !this.dev){
            const YouPayload = Payloads.YouMessage
            .toJSON();
            
            await Int.reply(YouPayload)
            return;
        }
        
        const thisThis = this;

        const Payload = {
            MultiplayerButtons: createActionRow(
                this.Buttons.Accept,
                this.Buttons.Deny
            ),
            MultiplayerButtonsDisabled: createActionRow(
                ButtonBuilder.from(this.Buttons.Accept).setDisabled(true),
                ButtonBuilder.from(this.Buttons.Deny).setDisabled(true)
            ),
            disabled: () => {
                return createActionRow(
                    ButtonBuilder.from(this.Buttons.Rock).setDisabled(true),
                    ButtonBuilder.from(this.Buttons.Paper).setDisabled(true),
                    ButtonBuilder.from(this.Buttons.Scissors).setDisabled(true)
                );
            },
            default: createActionRow(
                this.Buttons.Rock,
                this.Buttons.Paper,
                this.Buttons.Scissors
            ),
            defaultDisabled: (status: "WON" | "LOST" | "TIE", pick: "ROCK" | "PAPER" | "SCISSORS") => {
                //@ts-ignore
                pick = pick.toUpperCase();

                function getPick(){
                    if(pick == "PAPER"){
                        return thisThis.Buttons.Paper
                    } else if(pick == "ROCK"){
                        return thisThis.Buttons.Rock
                    } else if(pick == "SCISSORS"){
                        return thisThis.Buttons.Scissors
                    }
                }

                function actionRowWith(button: ButtonBuilder){
                    const customId = (button.toJSON() as APIButtonComponentWithCustomId).custom_id;
                    if(customId == customIds.Paper){
                        return [
                            ButtonBuilder.from(thisThis.Buttons.Rock).setDisabled(true),
                            ButtonBuilder.from(button).setDisabled(true),
                            ButtonBuilder.from(thisThis.Buttons.Scissors).setDisabled(true)
                        ]
                    } else if(customId == customIds.Rock){
                        return [
                            ButtonBuilder.from(button).setDisabled(true),
                            ButtonBuilder.from(thisThis.Buttons.Paper).setDisabled(true),
                            ButtonBuilder.from(thisThis.Buttons.Scissors).setDisabled(true)
                        ]
                    } else if(customId == customIds.Scissors){
                        return [
                            ButtonBuilder.from(thisThis.Buttons.Rock).setDisabled(true),
                            ButtonBuilder.from(thisThis.Buttons.Paper).setDisabled(true),
                            ButtonBuilder.from(button).setDisabled(true)
                        ]
                    }
                }

                if(status == "LOST"){
                    return createActionRow(
                        ...actionRowWith(ButtonBuilder.from(getPick()).setStyle(ButtonStyle.Danger).setDisabled(true))
                    );
                } else if(status == "TIE"){
                    return createActionRow(
                        ...actionRowWith(ButtonBuilder.from(getPick()).setStyle(ButtonStyle.Secondary).setDisabled(true))
                    );
                } else if(status == "WON"){
                    return createActionRow(
                        ...actionRowWith(ButtonBuilder.from(getPick()).setStyle(ButtonStyle.Success).setDisabled(true))
                    );
                }
            }
        }

        const JoinPayload = Payload.userInputMessage
        .setComponents([
            Payload.MultiplayerButtons
        ])
        .replaceOptions(e => {
            return e.replaceAll(`{{time}}`,
                new Timestamp()
                .setTime(Date.now() + this.TimeToJoin)
                .setStyle("R")
                .toString()
            )
            .replaceAll(`{{playerName}}`, Int.User.username)
            .replaceAll(`{{player}}`, Int.User.username)
            .replaceAll(`{{playerId}}`, Int.User.id)
            .replaceAll(`{{playerTag}}`, Int.User.tag)
            .replaceAll(`{{playerMention}}`, Int.User.toString())
            .replaceAll(`{{player2Name}}`, this.User.username)
            .replaceAll(`{{player2}}`, this.User.username)
            .replaceAll(`{{player2Id}}`, this.User.id)
            .replaceAll(`{{player2Tag}}`, this.User.tag)
            .replaceAll(`{{player2Mention}}`, this.User.toString());
        })
        .setFetchReply();

        /**
         * @type {Message}
         */
        const Reply = await Int.reply(JoinPayload.toJSON());

        setTimeout(async () => {
            const load = JoinPayload.setComponents([
                Payload.MultiplayerButtonsDisabled
            ])
            .toJSON();

            await Int.edit(load);
            return;
        }, this.TimeToJoin);

        const joinBt = await Interaction.channel.awaitMessageComponent({
            filter: i => i.user.id == this.User.id,
            componentType: "BUTTON",
            time: this.TimeToJoin
        });

        if(joinBt.customId == customIds.Deny) {
            const load = JoinPayload.setComponents([
                Payload.MultiplayerButtonsDisabled
            ])
            .toJSON();

            await Int.edit(load, joinBt);
            return;
        }

        const StartPayload = Payloads.Start
        .setComponents([
            Payload.default
        ])
        .toJSON();


        await Int.edit(StartPayload);

        const collector = await Reply.channel.createMessageComponentCollector({
            filter: i => i.user.id == Int.User.id,
            componentType: "BUTTON"
        });

        let player1Picked = false;
        let player1Pick = null;

        collector.on("collect", async i => {
            if(![customIds.Rock, customIds.Paper, customIds.Scissors].includes(i.customId)) return;

            if(!player1Picked){
                player1Pick = i.customId;
            } else {
                const choicesAr = [
                    "ROCK",
                    "PAPER",
                    "SCISSORS"
                ];
                const choices = {
                    "ROCK": "ROCK",
                    "PAPER": "PAPER",
                    "SCISSORS": "SCISSORS"
                };
        
                let AICount = (Math.round((Math.random() * choicesAr.length)-1));
                if(AICount == -1) AICount = 0;
                const AI = choicesAr[AICount];
                //if(AI == undefined) console.log(`💻 For debug reasons:`, AI, choicesAr, AICount);
        
                const optionChecker = (text) => {
                    const customId = i.customId.replace(BaseCustomId + "_", "")
                    .replace(`_${this.UUID[0]}`, "")
                    .replace(`_${this.UUID[1]}`, "")
                    .replace(`_${this.UUID[2]}`, "");
        
                    return text.replaceAll(`{{playerPick}}`, fixText(customId))
                    .replaceAll(`{{aiPick}}`, fixText(AI))
                    .replaceAll(`{{playerName}}`, i.user.username)
                    .replaceAll(`{{player}}`, i.user.username)
                    .replaceAll(`{{playerId}}`, i.user.id)
                    .replaceAll(`{{playerTag}}`, i.user.tag)
                    .replaceAll(`{{playerMention}}`, i.user.toString());
                }
        
                const OriginalCustomId = i.customId.replace(BaseCustomId + "_", "")
                .replace(`_${this.UUID[0]}`, "")
                .replace(`_${this.UUID[1]}`, "")
                .replace(`_${this.UUID[2]}`, "");
        
                /**
                 * @type {"WON"|"LOST"|"TIE"|"UNKNOWN"}
                 */
                let PlayerStatus = "UNKNOWN";
                if (
                    (AI === choices.SCISSORS && i.customId === customIds.Paper) ||
                    (AI === choices.ROCK && i.customId === customIds.Scissors) ||
                    (AI === choices.PAPER && i.customId === customIds.Rock)
                ) {
                    PlayerStatus = "LOST";
                } else if(AI == OriginalCustomId){
                    PlayerStatus = "TIE";
                } else {
                    PlayerStatus = "WON";
                }
        
                const WinPayload = Payloads.Win
                .setComponents([
                    Payload.defaultDisabled(PlayerStatus, OriginalCustomId)
                ])
                .replaceOptions(optionChecker)
                .toJSON();
        
                const LostPayload = Payloads.Lost
                .setComponents([
                    Payload.defaultDisabled(PlayerStatus, OriginalCustomId)
                ])
                .replaceOptions(optionChecker)
                .toJSON();
        
                const TiePayload = Payloads.Tie
                .setComponents([
                    Payload.defaultDisabled(PlayerStatus, OriginalCustomId)
                ])
                .replaceOptions(optionChecker)
                .toJSON();
        
                if (
                    (AI === choices.SCISSORS && i.customId === customIds.Paper) ||
                    (AI === choices.ROCK && i.customId === customIds.Scissors) ||
                    (AI === choices.PAPER && i.customId === customIds.Rock)
                ) {
                    await i.update(LostPayload);
                } else if(AI == OriginalCustomId){
                    await i.update(TiePayload);
                } else {
                    await i.update(WinPayload);
                }
            }
        });
    }
}

module.exports = RockPaperScissors;