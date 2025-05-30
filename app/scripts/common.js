import * as browser from "webextension-polyfill";

export const defaultPort = 3020;
const extensionVersion = browser.runtime.getManifest().version;

async function getBriskBaseUrl() {
    return "http://localhost:" + await getBriskPort();
}

export async function sendRequestToBrisk(body) {
    body.extensionVersion = extensionVersion;
    return await fetch(
        await getBriskBaseUrl(),
        {method: 'POST', body: JSON.stringify(body)}
    );
}

export async function getBriskPort() {
    let data = await browser.storage.local.get(['briskPort']);
    if (data.briskPort) {
        return data.briskPort;
    }
    return defaultPort;
}


export function extractResolution(text) {
    const match = text.match(/(?:\b|\D)(\d{3,4})p?\b/i);
    return match ? match[1] + (text.includes(match[1] + 'p') ? 'p' : '') : null;
}
