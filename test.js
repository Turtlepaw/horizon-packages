const brain = require('brain.js');
const colors = require('colors');
const { promisify } = require('util');
const wait = promisify(setTimeout);
const json = require("./packages/scam/jsons/discordRelated.json");

(async () => {
    const netword = new brain.NeuralNetworkGPU();

    let v = 0;
    let v2 = 0;
    let max = 20;
    let spinner = (a) => {
        if (a >= max) {
            a = max;
        }
        return "[" + "#".repeat(a).blue + ".".repeat(max - a).gray + "]"
    };
    let skipped = 0;
    let shouldSkip = 500;
    let skipped2 = 0;
    let should2Skip = 1;
    console.log("Training...".blue);
    const results = await netword.trainAsync(
        await Promise.resolve(json.links.map(async link => {
            if (skipped < shouldSkip) {
                skipped++;
            } else {
                skipped = 0;
                v++;
            }
            console.clear();
            wait(30000);
            await setTimeout(10000)
            console.log(spinner(v) + " Adding link: ".blue + link.dim.underline)
            return ({
                input: link,
                output: {
                    malicious: true
                }
            });
        }))
    ).then(console.log);

    console.log(results.error);

    console.log("Trained!".green);
    console.log("Running...".blue);

    const res = [
        netword.runInput("101nitro.com"),
        netword.runInput("discord.gg")
    ];

    console.log("Result: ".blue);

    console.log(res);
})();