"use strict";
const DEBUG = true;

// global configurations
import {config} from './config';

// disable all browser action until a video is found
chrome.browserAction.disable();

chrome.runtime.onMessage.addListener(messageHandler);

function messageHandler(request, sender, sendResponse) {
    if (!request.action) return;

    const {action} = request;
    const senderTabId = sender.tab.id;

    switch (action) {
        // when a content script find a video notify other content scripts on the same tab so they will stop searching
        case "stopSearching":
            log("stop searching a content script has found a video, notify others");
            chrome.tabs.sendMessage(senderTabId, {action: "stopSearching"});
            break;

        case "scriptHasFoundVideo":
            chrome.browserAction.enable(senderTabId);
            break;

        case "setBrowserActionBadge":
            setBrowserActionBadge(senderTabId, request.text, request.color);
            break;

        case "globalLogger":
            globalLogger(request.sender, request.msg, request.color);
            break;

        case "jsError":
            globalWinOnerror(request.sender, request.color);
            break;
    }
}

/**
 * @param text Any number of characters can be passed, but only about four can fit in the space.
 */
function setBrowserActionBadge(tabId, text = "", color = "red") {
    chrome.browserAction.setBadgeBackgroundColor({color, tabId});
    chrome.browserAction.setBadgeText({text, tabId});
}

function log(msg) {
    if (DEBUG) globalLogger("bg", msg, config.bg.debugColor);
}

function globalLogger(sender, msg, colorSender = "black", colorMsg = "black"){
    console.log(`%c${sender}: %c${msg}`, `color: ${colorSender};`, `color: ${colorMsg};`);
}

function globalWinOnerror(sender, color){
    globalLogger(sender, "Uncaught Error, see console.", color, "red");
}

// exported for extension-wide access
window.globalLogger = globalLogger;
window.globalWinOnerror = globalWinOnerror;
