declare global {
    interface String {
        fix(): string;
    }
}

String.prototype.fix = function() {
    //return this.charAt(0).toUpperCase() + this.slice(1);
    let text: string = this;

    //Make this a string
    text = text.toString();

    //Get the first letter and get the other text
    let newText = text.slice(1, text.length);
    let oldText = text.slice(0, 1);

    //Merge them and make the first letter upper case
    let returnedText = oldText.toUpperCase() + newText.toLowerCase();

    //Remove `_` and `-`
    returnedText = returnedText.replaceAll(`_`, ` `).replaceAll(`-`, ` `)

    //Return the final text
    return `${returnedText}`;
}

export {};
