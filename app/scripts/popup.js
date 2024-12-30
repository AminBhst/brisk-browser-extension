import * as browser from 'webextension-polyfill';
import {sendRequestToBrisk} from "./common";

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
            createM3u8List(response.m3u8Urls, listContainer);
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