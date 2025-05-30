import * as browser from 'webextension-polyfill';
import {sendRequestToBrisk, extractResolution} from "./common";

async function createM3u8List(tabId, m3u8Urls, listContainer) {
    let suggestedName = await browser.tabs.sendMessage(tabId, {type: 'get-suggested-video-name'});
    m3u8Urls.forEach((obj) => {
        const listItem = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = resolveSuggestedName(obj, suggestedName, true);
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.classList.add('download-btn');
        registerVideoStreamDownloadClickListener(downloadButton, obj);
        listItem.appendChild(nameSpan);
        listItem.appendChild(downloadButton);
        listContainer.appendChild(listItem);
    });
}


function resolveSuggestedName(obj, suggestedName, handleMaster) {
    let fileNameFromUrl = obj.url.substring(obj.url.lastIndexOf('/') + 1)
    if (fileNameFromUrl.includes('.m3u8?')) {
        fileNameFromUrl = fileNameFromUrl.substring(0, fileNameFromUrl.indexOf('.m3u8?') + 5)
    }
    if (fileNameFromUrl.includes('.mp4?')) {
        fileNameFromUrl = fileNameFromUrl.substring(0, fileNameFromUrl.indexOf('.mp4?') + 4)
    }
    if (suggestedName == null || suggestedName === '') {
        return fileNameFromUrl;
    }
    let resolution = extractResolution(fileNameFromUrl);
    if (suggestedName.endsWith(".mp4")) {
        return resolution
            ? `${suggestedName}.${resolution}.mp4`
            : `${suggestedName}.mp4`;
    } else if (handleMaster && fileNameFromUrl.includes("master")) {
        return `${suggestedName}.all.resolutions.ts`;
    } else {
        return `${suggestedName}.ts`;
    }
}

function registerVideoStreamDownloadClickListener(downloadButton, obj) {
    downloadButton.addEventListener('click', async () => {
        let tabId = await getCurrentTabId();
        const tab = await browser.tabs.get(tabId);
        let suggestedName = await browser.tabs.sendMessage(tabId, {type: 'get-suggested-video-name'});
        suggestedName = resolveSuggestedName(obj, suggestedName, false);
        if (obj.url.endsWith(".mp4") || obj.url.endsWith(".webm")) {
            let body = {
                'type': 'single',
                'data': {
                    'url': obj.url,
                    'referer': tab.url,
                    'suggestedName': suggestedName,
                    'refererHeader': obj.referer,
                }
            };
            await sendRequestToBrisk(body);
        } else {
            let vttUrls = await browser.runtime.sendMessage({type: 'get-vtt-list', tabId});
            await sendRequestToBrisk({
                'type': 'm3u8',
                'm3u8Url': obj.url,
                'vttUrls': vttUrls['vttUrls'],
                'referer': tab.url,
                'suggestedName': suggestedName,
                'refererHeader': obj.referer,
            });
        }
    });
}

async function getCurrentTabId() {
    let tabs = await browser.tabs.query({active: true, currentWindow: true});
    return tabs[0].id;
}

document.addEventListener('DOMContentLoaded', () => {
    const portInput = document.getElementById('port');
    const savePortButton = document.getElementById('save-port');
    browser.storage.local.get('briskPort').then((data) => {
        if (data.briskPort) {
            portInput.value = data.briskPort;
        } else {
            portInput.value = 3020;
        }
    }).catch((error) => {
        console.error('Failed to load port from storage:', error);
    });
    savePortButton.addEventListener('click', () => {
        const port = portInput.value;
        if (port >= 1 && port <= 65535) {
            browser.storage.local.set({briskPort: port}).then(() => {
                alert('Port saved successfully!');
            }).catch((error) => {
                console.error('Failed to save port:', error);
            });
        } else {
            alert('Please enter a valid port number (1-65535).');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('m3u8-list');
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        const tabId = tabs[0].id; // Get current tab's ID
        browser.runtime.sendMessage({type: 'get-m3u8-list', tabId}).then((response) => {
            console.log(`m3u8 received ${response.m3u8Urls}`);
            createM3u8List(tabId, response.m3u8Urls, listContainer);
        });
    });
});

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tab);
        });
    });
});