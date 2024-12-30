import * as browser from 'webextension-polyfill';
import {sendRequestToBrisk} from "./common";

let m3u8UrlsByTab = {};
let vttUrlsByTab = {};
let downloadHrefs;
createContextMenuItem();
browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.set({briskPort: 3020});
});

browser.downloads.onCreated.addListener(sendBriskDownloadAdditionRequest);

browser.runtime.onMessage.addListener((message) => downloadHrefs = message);

// Listen for m3u8 requests
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const {tabId, url} = details;
        if (url.endsWith('.m3u8')) {
            addUrlToTab(m3u8UrlsByTab, tabId, url);
        }
        if (url.endsWith('.vtt')) {
            addUrlToTab(vttUrlsByTab, tabId, url);
        }
    },
    {urls: ['<all_urls>']},
    []
);

function addUrlToTab(urlsByTab, tabId, url) {
    if (!urlsByTab[tabId]) {
        urlsByTab[tabId] = [];
    }
    if (!urlsByTab[tabId].includes(url)) {
        urlsByTab[tabId].push(url);
    }
}

// Listen for tab reload events to clear the m3u8 URLs for that tab
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        m3u8UrlsByTab[tabId] = [];
        vttUrlsByTab[tabId] = [];
    }
});

// Listen for requests from popup to get m3u8 URLs for the current tab
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'get-m3u8-list') {
        const urls = m3u8UrlsByTab[message.tabId] || [];
        sendResponse({m3u8Urls: urls});
    }
    if (message.type === 'get-vtt-list') {
        const urls = vttUrlsByTab[message.tabId] || [];
        sendResponse({vttUrls: urls});
    }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "brisk-download") {
        let body = {
            "type": "multi",
            "data": {downloadHrefs}
        };
        try {
            await sendRequestToBrisk(body);
        } catch (e) {
            console.error("Failed to send request to Brisk!");
        }
    }
});


async function sendBriskDownloadAdditionRequest(downloadItem) {
    let body = {
        "type": "single",
        "data": {
            'url': downloadItem.url,
            'totalBytes': downloadItem.totalBytes,
            'cookies': downloadItem.cookies
        }
    };
    let response = await sendRequestToBrisk(body);
    let json = await response.json();
    if (response.status === 200 && json["captured"]) {
        await removeBrowserDownload(downloadItem.id);
    }
}

async function removeBrowserDownload(id) {
    await browser.downloads.cancel(id).then(pass).catch(console.log);
    await browser.downloads.erase({id}).then(pass).catch(console.log);
    await browser.downloads.removeFile(id).then(pass).catch(pass);
}

function createContextMenuItem() {
    browser.contextMenus.removeAll().then(() => {
            browser.contextMenus.create({
                id: "brisk-download",
                title: "Download selected links with Brisk",
                contexts: ["selection"]
            }, () => null);
        }
    ).catch(console.log);
}

const pass = () => null;