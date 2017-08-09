"use strict";

// globals
const DEBUG = true;
const OpenSubtitles = require('opensubtitles-api');
const OS = new OpenSubtitles({
    useragent: privates.OpenSubtitles.UserAgent,
    ssl: true
});

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
    }
}

function searchSuggestions(term, langId) {
    const data = {
        format: 'json3',
        MovieName: term,
        SubLanguageID: langId
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'http://www.opensubtitles.org/libs/suggest.php',
            type: 'get',
            dataType: 'json',
            crossDomain: true,
            data,
            xhrFields: {
                withCredentials: true
            },
            success: function (data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                reject(errorThrown);
            }
        });
    });
}

function osSearch(query, langId) {
    return OS.search({ // Promise
        sublanguageid: langId, // ISO639 2 letter code (use [].join(',') for multiple languages)
        query,
        limit: 'all', // Can be 'best', 'all' or an arbitrary nb. Defaults to 'best'
        gzip: true
    });
}

/**
 * @param text Any number of characters can be passed, but only about four can fit in the space.
 */
function setBrowserActionBadge(tabId, text = "", color = "red") {
    chrome.browserAction.setBadgeBackgroundColor({color, tabId});
    chrome.browserAction.setBadgeText({text, tabId});
}

function log(msg) {
    if (DEBUG)
        console.log(msg);
}

// exported for extension-wide access
window.osLangs = OS_LANGS;
window.searchSuggestions = searchSuggestions;
window.osSearch = osSearch;
