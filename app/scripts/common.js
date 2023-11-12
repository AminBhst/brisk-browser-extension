import * as browser from "webextension-polyfill";

export const defaultPort = 3020;

async function getBriskBaseUrl() {
    return "http://localhost:" + await getBriskPort();
}

let lastRequestSent = 0;
export async function sendRequestToBrisk(body) {
    // if (lastRequestSent + 1000 > Date.now())
    //     return;

    // lastRequestSent = Date.now();
    return await fetch(
        await getBriskBaseUrl(),
        {method: 'POST', body: JSON.stringify(body)}
    );
}

export async function getBriskPort() {
    let val = await browser.storage.sync.get(['briskPort']);
    if (!val || Object.keys(val).length === 0) {
        await browser.storage.sync.set({briskPort: defaultPort});
        return defaultPort;
    }
    return val['briskPort'];
}
