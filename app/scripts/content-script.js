import * as browser from 'webextension-polyfill';

const hostname = window.location.hostname.replace(/^www\./, '');

const videoNameResolvers = {
    'aniwatchtv.to': resolve_aniWatchVideoName,
    'hianimez.to': resolve_aniWatchVideoName,
    'aniplaynow.live': resolve_aniPlayVideoName,
    'openani.me': resolve_openAnime,
    [atob('aGFuaW1lLnR2')]: resolve_aGFuaW1lLnR2,
    [atob('aGVudGFpaGF2ZW4ueHh4')]: resolve_aGVudGFpaGF2ZW4ueHh4,
};

function resolve_aGVudGFpaGF2ZW4ueHh4() {
    const heading = document.querySelector('#chapter-heading');
    if (!heading) {
        return null;
    }
    const rawText = heading.textContent.trim();
    const parts = rawText.split('-').map(part => part.trim());
    if (parts.length === 2) {
        const titlePart = parts[0].replace(/\s+/g, '.');
        const episodePart = parts[1].replace(/\s+/g, '.');
        return `${titlePart}.${episodePart}`;
    }
    const cleaned = rawText
        .replace(/\s+/g, '.')
        .replace(/[^\w.-]/g, '');
    if (!cleaned) {
        return null;
    }
    return cleaned;
}

function resolve_openAnime() {
    let title = document.title
        .replaceAll("|", "")
        .replaceAll("OpenAnime", "")
        .trim();

    return title.endsWith('.') ? title.slice(0, -1) : title;
}

function resolve_aGFuaW1lLnR2() {
    const titleElement = document.querySelector('.tv-title');
    if (titleElement) {
        return titleElement.textContent.trim();
    }
}

function resolve_aniPlayVideoName() {
    const titleElement = document.querySelector('a[href*="/anime/info/"] span');
    const animeName = titleElement?.textContent.trim();
    const episodeElement = document.querySelector('span.font-medium.text-sm.md\\:text-white');
    const episodeNumber = episodeElement ? episodeElement.textContent.trim() : null;
    const epNum = episodeNumber ? episodeNumber.match(/\d+/)?.[0] : null;
    if (epNum == null) return animeName;
    const epNumPadded = epNum.toString().padStart(2, '0');
    return `${animeName}.${epNumPadded}`;
}

function resolve_aniWatchVideoName() {
    const animeName = document.querySelector('h2.film-name a')?.textContent?.trim() || null;
    const notice = document.querySelector('.server-notice strong b');
    if (!notice || !animeName) return null;
    const text = notice.textContent.trim(); // e.g. "Episode 2"
    const match = text.match(/\d+/);
    let epNum = match ? parseInt(match[0], 10) : null;
    if (epNum === null) return animeName;
    const epNumPadded = epNum.toString().padStart(2, '0');
    return `${animeName}.${epNumPadded}`;
}

function getSuggestedVideoName() {
    const resolver = videoNameResolvers[hostname];
    if (!resolver) return null;
    return resolver().replace(/[\\\/:*?"<>|=]/g, '.').replace(/\s+/g, '.');
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'get-suggested-video-name') {
        const suggestedName = getSuggestedVideoName();
        sendResponse(suggestedName);
        return true;
    }
});

function debounce(fn, delay) {
    let timer = null;
    return function () {
        let context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

document.addEventListener("selectionchange", debounce(function (event) {
    try {
        let extractedHrefs = getHrefOfAllSelectedLinks();
        sendHrefsToBackground(extractedHrefs);
    } catch (e) {
        console.log(e);
    }
}, 250));


function sendHrefsToBackground(hrefs) {
    browser.runtime.sendMessage(hrefs);
}

const getHrefOfAllSelectedLinks = () => getSelectedNodes()
    .filter(node => node.tagName === "A")
    .map(node => node.href);


function getSelectedNodes() {
    const selection = document.getSelection();
    const fragment = document.createDocumentFragment();
    const nodeList = [];

    for (let i = 0; i < selection.rangeCount; i++) {
        fragment.append(selection.getRangeAt(i).cloneContents());
    }

    const walker = document.createTreeWalker(fragment);
    let currentNode = walker.currentNode;
    while (currentNode) {
        nodeList.push(currentNode);
        currentNode = walker.nextNode();
    }

    return nodeList;
}
