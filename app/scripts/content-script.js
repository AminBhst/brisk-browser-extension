import * as browser from 'webextension-polyfill';

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
