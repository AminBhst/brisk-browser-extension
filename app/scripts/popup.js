import * as browser from 'webextension-polyfill';
import {sendRequestToBrisk} from "./common";


document.addEventListener('DOMContentLoaded', async () => {
    await setPortValue();
    setSaveButtonAction();
});


function createM3u8List(m3u8Urls, listContainer) {
    m3u8Urls.forEach((url) => {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        const listItem = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = fileName;
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.classList.add('download-btn');
        downloadButton.addEventListener('click', () => {
            sendRequestToBrisk({
                'type': 'm3u8',
                'url': url
            });
        });
        listItem.appendChild(nameSpan);
        listItem.appendChild(downloadButton);
        listContainer.appendChild(listItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('m3u8-list');
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tabId = tabs[0].id; // Get current tab's ID
        browser.runtime.sendMessage({type: 'get-m3u8-list', tabId}, (response) => {
            createM3u8List(response.m3u8Urls, listContainer);
        });
    });
});


// Listen for new m3u8 URLs from background.js
browser.runtime.onMessage.addListener((message) => {
    const listContainer = document.getElementById('m3u8-list');
    if (message.type === 'new-m3u8' && message.tabId === getCurrentTabId()) {
        createM3u8List(message.m3u8Urls, listContainer);
    }
});

// Function to get the current tab's ID
function getCurrentTabId() {
    let tabId = null;
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        tabId = tabs[0].id;
    });
    return tabId;
}


async function onSaveClicked() {
    let port = document.getElementById("port").value;
    await browser.storage.sync.set({briskPort: port});
    alert("Saved!")
}

function setSaveButtonAction() {
    document.addEventListener('DOMContentLoaded', function () {
        let save = document.getElementById('save');
        save.addEventListener('click', onSaveClicked);
    });
}

async function setPortValue() {
    try {
        let val = await browser.storage.sync.get(['briskPort']);
        document.getElementById("port").value = val['briskPort'];
    } catch (e) {
        console.log(e);
    }
}