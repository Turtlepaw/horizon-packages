export default class GameError extends Error {
  constructor(message: string, header: Headers = Headers.UnknownError) {
    if (typeof message != "string")
      throw new GameError(
        `Expected a string for 'message', recieved ${typeof message}`,
        Headers.InvalidConstructorArgument
      );
    if (typeof header != "string")
      throw new GameError(
        `Expected a string for 'header', recieved ${typeof header}`,
        Headers.InvalidConstructorArgument
      );

    super(message);
    this.name = `GameError [${header}]`;
  }
}

export enum Headers {
  InvalidArgument = "INVALID_ARGUMENT",
  InvalidConstructorArgument = "INVALID_CONSTRUCTOR_ARGUMENT",
  InvalidEmbed = "INVALID_EMBED",
  MessageCommand = "MESSAGE_COMMAND",
  InvalidInteraction = "INVALID_INTERACTION",
  InvalidChannel = "INVALID_CHANNEL",
  InvalidUser = "INVALID_USER",
  UnknownError = "UNKNOWN_ERROR"
}