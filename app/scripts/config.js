import * as browser from 'webextension-polyfill';


document.addEventListener('DOMContentLoaded', async () => {
    await setPortValue();
    setSaveButtonAction();
});

async function onSaveClicked() {
    let port = document.getElementById("port").value;
    await browser.storage.sync.set({briskPort: port});
    alert("Saved!")
}

function setSaveButtonAction() {
    document.addEventListener('DOMContentLoaded', function() {
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