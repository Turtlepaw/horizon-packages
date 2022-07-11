import { ScamType } from "..";

interface URL {
    url: string;
    type: "JSON" | "TXT";
    category: ScamType;
}

export async function fetchFiles(){
    const urls: URL[] = [
        {
            url: "https://raw.githubusercontent.com/Discord-AntiScam/scam-links/main/urls.json",
            type: "JSON",
            category: ScamType.DiscordRelated
        },
        {
            url: "https://raw.githubusercontent.com/BuildBot42/discord-scam-links/main/list.txt",
            type: "TXT",
            category: ScamType.DiscordRelated
        }
    ];
    const jsons: object[] = [];

    for(const url of urls){
        if(url.type == "TXT"){
            const text = await fetch(url.url).then(res => res.text());
            const json = text.split("\n");

            jsons.push(json);
        }
    }
}