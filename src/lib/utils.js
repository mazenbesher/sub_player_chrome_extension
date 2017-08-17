import { privates } from "./data/private";
import { config } from 'lib/config';
import * as $ from 'jquery';

// globals
const OpenSubtitles = require('opensubtitles-api');
const OS = new OpenSubtitles({
    useragent: privates.OpenSubtitles.UserAgent,
    ssl: true
});

// promise for getting active tab id
export const getActiveTabId = () => new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve(tabs[0].id);
    });
});

// send message
export const sendMessage = msg => {
    return new Promise(resolve => {
        getActiveTabId().then(activeTabId => {
            chrome.tabs.sendMessage(activeTabId, msg, response => resolve(response));
        });
    });
}

export function searchSuggestions(term, langId) {
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

export function osSearch(query, langId) {
    return OS.search({ // Promise
        sublanguageid: langId, // ISO639 2 letter code (use [].join(',') for multiple languages)
        query,
        limit: 'all', // Can be 'best', 'all' or an arbitrary nb. Defaults to 'best'
        gzip: true
    });
}

export function log(msg) {
    if (!config.debug) return;

    chrome.runtime.sendMessage({
        action: "globalLogger",
        sender: "contentscript",
        color: config.contentscript.debugColor,
        msg
    });
}