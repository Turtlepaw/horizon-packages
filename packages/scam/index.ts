import { links as DiscordRelatedScams } from "./jsons/discordRelated.json";
import TrustedWebsites from "./jsons/trustedSites.json";
import OtherScams from "./jsons/other.json";
import { fetchFiles as GithubProvidedFiles } from "./jsons/index";
import puppeteer from "puppeteer";
import brain from "brain.js";
import fetch from "node-fetch";

let deepScanInitiated = false;
let network;

function initiateDeepScan(){
    network = new brain.NeuralNetwork();

    //network.train(getAllJSONs());
}

function hostName(websiteURL: string) {
    let str: string;

    if (websiteURL.indexOf("//") > -1) {
        str = websiteURL.split('/')[2];
    } else {
        str = websiteURL.split('/')[0];
    }
    str = str.split(':')[0];
    str = str.split('?')[0];
    return str;
}

function extractURLs(text: string): string[] {
    //Get all urls of text
    const regex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(regex);
    return urls;
}

function getAllJSONs() {
    return [
        ...DiscordRelatedScams
    ];
}

export interface ScamCheckOptions {
    /**
     * The full text, no edits are required.
     */
    fullText: string;
    /**
     * This feature is unstable and may have inacurate results.
     * We do not recommend using this feature unless you know what you are doing.
     */
    deepScan?: boolean;
    /**
     * The providers to check against.
     * If not specified, all providers will be checked.
     */
    providers?: Providers[];
}

export enum ScamType {
    DiscordRelated = "DISCORD",
    Impersonation = "IMPERSONATION",
    SteamRelated = "STEAM",
    Phishing = "PHISHING",
    Other = "OTHER",
    None = "NONE"
}

export enum WebsiteTypes {
    Trusted = "TRUSTED",
    Unknown = "UNKNOWN",
    Unverified = "UNVERIFIED",
    KnownScam = "KNOWN_SCAM",
    PotentialScam = "POTENTIAL_SCAM"
}

export interface URL {
    isScam: () => boolean;
    scamType: ScamType;
    URL: string;
    screenshot: Buffer;
    websiteType: WebsiteTypes;
}

export interface ScamCheckResult {
    URLs: URL[];
}

export function formatString(str: string) {
    return str.toLowerCase()
        .toString();
}

/**
 * Providers are responsible for checking if a given string is a scam or not.
 * 
 * **What about TrustedSites?**
 * 
 * TrustedSites are websites that are known to be safe. If you add them to {@link https://docs.trtle.xyz/docs/packages/scam/check#options ScamCheckOptions#providers} they will be ignored from the URLs. This is useful for high-secruity checks.
 */
export enum Providers {
    DiscordRelated = "DISCORD",
    Other = "OTHER",
    TrustedSites = "TRUSTED_SITES",
    GitHub = "GITHUB",
    All = "ALL"
}

export interface DeepScanResult {
    potentialScams: URL[];
}

export interface URLPathResult {
    path: string;
    hostName: string;
}

export interface isURLOptions {
    httpsOnly?: boolean;
    httpOnly?: boolean;
    noProtocol?: boolean;
    protocol?: boolean;
}

export enum WebsiteStatus {
    Online = "ONLINE",
    Offline = "OFFLINE",
    Unknown = "UNKNOWN"
}

export async function isURL(url: string, options?: isURLOptions){
    const host = hostName(url);
    const endings = await fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt").then(res => res.text());
    const hasValidEnding = endings.split("\n").includes(host.slice(host.lastIndexOf(".")+1, host.length).toUpperCase());

    if(options?.httpsOnly || options.protocol){
        return hasValidEnding && url.startsWith("https://");
    } else if(options?.httpOnly || options?.protocol){
        return hasValidEnding && url.startsWith("http://");
    } else {
        return hasValidEnding;
    }
}

export async function UrlInfo(url: string){
    if(!isURL(url)) return null;
    if(!isURL(url, { protocol: true })) url = `http://${url}/`;
    const fetched = await fetch(url);
    const screenshot = await getScreenshot(null, url);

    return {
        /**
         * Without the protocol.
         */
        withoutProtocol: url.replace("http://", "").replace("https://", ""),
        /**
         * The path of the URL. (e.g. /path/to/page)
         */
        path: url.split("/").slice(3).join("/"),
        /**
         * The full URL given.
         */
        URL: url,
        /**
         * A quick screenshot of the website.
         */
        screenshot,
        /**
         * The status of the website.
         */
        status: fetched.ok ? WebsiteStatus.Online : WebsiteStatus.Offline,
        /**
         * The URL without the protocol and path.
         */
        withoutPath: hostName(url)
    }
}

/**
 * Deep scan the website for potential scams.
 * This feature is unstable and may have inacurate results.
 * {@link https://docs.trtle.xyz/packages/scam/deepscan Learn More}
 * @deprecated Use {@link https://docs.trtle.xyz/packages/scam/ScamCheckOptions#deepScan ScamCheckOptions#deepScan} instead
 * @see ScamCheckOptions#deepScan
 */
export async function deepScan(websiteURL: string): Promise<DeepScanResult> {
    const potentialScams: URL[] = [];
    const URLs = [websiteURL, ...(hostName(websiteURL) == websiteURL ? [] : [hostName(websiteURL)])];
    const browser = await puppeteer.launch();

    for (const url of URLs) {
        const page = await browser.newPage();
        await page.goto(websiteURL);
        const buffer = await getScreenshot(browser, page);
        const $ = (await page.content()).toLowerCase();

        if($.includes("steam") && !TrustedWebsites.includes(websiteURL)) {
            potentialScams.push({
                screenshot: buffer,
                isScam: () => true,
                scamType: ScamType.SteamRelated,
                URL: url,
                websiteType: WebsiteTypes.PotentialScam
            });
        } else if($.includes("discord") && $.includes("gift") && !TrustedWebsites.includes(websiteURL)) {
            potentialScams.push({
                screenshot: buffer,
                isScam: () => true,
                scamType: ScamType.DiscordRelated,
                URL: url,
                websiteType: WebsiteTypes.PotentialScam
            });
        }
    }

    await browser.close();

    return {
        potentialScams
    };
}

/**
 * Captures a screenshot of the website.
 */
export async function getScreenshot(browser: puppeteer.Browser, page: string | puppeteer.Page): Promise<Buffer> {
    if(!browser) browser = await puppeteer.launch();
    if(typeof page == "string"){
        const pageURL = page;
        page = await browser.newPage();
        await page.goto(pageURL);
    }
    const buffer = await page.screenshot({
        omitBackground: true,
        encoding: 'binary'
    });
    if (typeof buffer == "string") throw new Error("Screenshot failed: page.screenshot() returned a string");
    return buffer;
}

function removeDuplicates(arr: any[]) { 
    return arr.filter((item, index) => arr.indexOf(item) === index);
}   

export async function check({ fullText, deepScan: DEEP_SCAN, providers }: ScamCheckOptions) {
    if(providers == null || providers.includes(Providers.All)) providers = Object.values(Providers);
    const scams: URL[] = [];
    const URLs = removeDuplicates([...extractURLs(fullText), ...extractURLs(fullText).map(url => hostName(url))]);
    fullText = formatString(fullText);
    const browser = await puppeteer.launch();

    for (const url of URLs) {
        if (DiscordRelatedScams.includes(url) && providers.includes(Providers.DiscordRelated)) {
            const screenshot = await getScreenshot(browser, url);

            scams.push({
                isScam: () => true,
                scamType: ScamType.DiscordRelated,
                URL: url,
                screenshot,
                websiteType: WebsiteTypes.KnownScam
            });
        } else if(DEEP_SCAN == true) {
            //Deep scan is the last resort.
            (await deepScan(url)).potentialScams.forEach(e => scams.push(e));
        } else if(TrustedWebsites.includes(url) && providers.includes(Providers.TrustedSites)) {
            const screenshot = await getScreenshot(browser, url);

            scams.push({
                isScam: () => false,
                scamType: ScamType.None,
                URL: url,
                screenshot,
                websiteType: WebsiteTypes.Trusted
            });
        } else {
            const screenshot = await getScreenshot(browser, url);

            scams.push({
                isScam: () => false,
                scamType: ScamType.None,
                URL: url,
                screenshot,
                websiteType: WebsiteTypes.Unverified
            });
        }
    }

    return scams;
}

export function toJSON() {
    return getAllJSONs();
}
