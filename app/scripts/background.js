import * as browser from 'webextension-polyfill';
import {sendRequestToBrisk} from "./common";


let downloadHrefs;
createContextMenuItem();
browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.set({briskPort: 3020});
});
browser.downloads.onCreated.addListener(sendBriskDownloadAdditionRequest);
browser.runtime.onMessage.addListener((message) => downloadHrefs = message);

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