"use strict";

chrome.runtime.onMessage.addListener(messageHandler);

function messageHandler(request, sender, sendResponse) {
    // when a content script find a video notify other content scripts on the same tab so they will stop searching
    if(request.action && request.action == "stopSearching");
    chrome.tabs.sendMessage(sender.tab.id, {
        action: "stopSearching"
    })
}
