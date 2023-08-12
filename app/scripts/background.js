import * as browser from 'webextension-polyfill';

const defaultPort = 3020;
browser.downloads.onCreated.addListener(handleOnCreateDownload);

async function handleOnCreateDownload(downloadItem) {
    await removeBrowserDownload(downloadItem.id);
    await sendBriskRequest(downloadItem)
}

async function sendBriskRequest(downloadItem) {
    let port = await getBriskPort();
    const baseUrl = "http://localhost:" + port;
    console.log(baseUrl);
    let body = {
        'url' : downloadItem.url,
        'totalBytes': downloadItem.totalBytes,
        'cookies': downloadItem.cookies
    };
    fetch(baseUrl, {method: 'POST', body: JSON.stringify(body)}).then(pass);
}

async function getBriskPort() {
    let val = await browser.storage.sync.get(['briskPort']);
    if (!val || Object.keys(val).length === 0) {
        await browser.storage.sync.set({briskPort: defaultPort});
        return defaultPort;
    }
    return val['briskPort'];
}

async function removeBrowserDownload(id) {
    await browser.downloads.cancel(id).then(pass).catch(console.log);
    await browser.downloads.erase({ id }).then(pass).catch(console.log);
    await browser.downloads.removeFile(id).then(pass).catch(pass);
}
const pass = () => null;