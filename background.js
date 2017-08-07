"use strict";

chrome.runtime.onMessage.addListener(messageHandler);

// disable all browser action until a video is found
chrome.browserAction.disable();

function messageHandler(request, sender, sendResponse) {
    if (!request.action) return;

    const {action} = request;
    const senderTabId = sender.tab.id;

    switch (action) {
        // when a content script find a video notify other content scripts on the same tab so they will stop searching
        case "stopSearching":
            chrome.tabs.sendMessage(senderTabId, {action: "stopSearching"});
            break;

        case "scriptHasFoundVideo":
            chrome.browserAction.enable(senderTabId);
            break;

        case "setBrowserActionBadge":
            setBrowserActionBadge(request.text, senderTabId);
            break;
    }
}

function setBrowserActionBadge(text, tabId) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: "red",
        tabId: tabId
    });

    chrome.browserAction.setBadgeText({
        text, // Any number of characters can be passed, but only about four can fit in the space.
        tabId
    });
}

////////////////// TESTING /////////////////////////////

// ---------------------------------------- downloads
// chrome.downloads.download(
//     {
//         url: 'https://i.imgur.com/yK7dFur.jpg'
//     },
//     downloadId => {
//         console.log(downloadId);
//     }
// );

