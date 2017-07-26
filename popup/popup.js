"use strict";

// Globals
var activeTabId;
var videoSrcHash;
var subtitleFileName;

// for detecting encoding
var detect = require('charset-detector')

// set active tab id and search for video when the popup is opened
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    activeTabId = tabs[0].id;
    searchForVideos();
});

// hide encoding detection info
document.getElementById("detected_encoding").style.visibility = "hidden";

// state and register keyboard events for video playback
const regKeyEventsState = document.getElementById("reg_keyboard_event_state");
const regKeyEventsBtn = document.getElementById("reg_keyboard_event");
regKeyEventsBtn.disabled = true; // enable if video found
regKeyEventsBtn.onclick = () => {
    chrome.tabs.sendMessage(activeTabId, {action: "regKeyboardEventForVideoPlayback"});
    regKeyEventsBtn.disabled = true;
    regKeyEventsState.innerText = "registered!";
};

// Unload subtitle
const unloadSubBtn = document.getElementById("unload_curr_subtitle");
unloadSubBtn.disabled = true;
unloadSubBtn.onclick = unloadCurrSubtitle;

const subtitleSeek = document.getElementById("subtitle_seek");
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getSubSeek"}, function (response) {
        if (response != undefined && response.seeked) {
            subtitleSeek.innerText = response.amount;
        }
    });
});

// File input
const fileInput = document.getElementById("subtitle_file_input");
fileInput.disabled = true;
fileInput.onchange = readFile;

// Search btn
const searchBtn = document.getElementById("search_for_video_btn");
searchBtn.onclick = searchForVideos;

// Enable/Disable manual encoding selection
const manEncodingSection = document.getElementById("manual_encoding_selection");
manEncodingSection.style.visibility = "hidden";

const manEncodingCheckbox = document.getElementById("manual_encoding_detection");
manEncodingCheckbox.onchange = function () {
    if (this.checked) {
        manEncodingSection.style.visibility = "visible";
    } else {
        manEncodingSection.style.visibility = "hidden";
    }
};

// Sync listeners
document.querySelectorAll("#subtitle_controls input[data-sync-amount]").forEach((elm, index) => {
    elm.onclick = () => seek(parseInt(elm.getAttribute("data-sync-amount")));
    elm.disabled = true;
});

function searchForVideos() {
    chrome.tabs.sendMessage(activeTabId, {action: "searchForVideos"}, function (response) {
        if (response != undefined && response.videoDetected) { // NOTE: response can be undefined if none of the content scripts (possibly in multiple frames) detected a video -> no response is sent back
            videoSrcHash = response["videoSrcHash"];
            videoFound();
        }
    });
}

function videoFound() {
    fileInput.disabled = false;
    searchBtn.disabled = true;
    checkIfVideoHasSubtitleInStorage();

    regKeyEventsBtn.disabled = false;
    checkIfKeyEventsAreRegistered();
}

function checkIfKeyEventsAreRegistered() {
    chrome.tabs.sendMessage(activeTabId, {action: "getRegKeyEventsState"}, function (response) {
        if (response.registered) {
            regKeyEventsState.innerText = "registered!";
            regKeyEventsBtn.disabled = true;
        } else {
            regKeyEventsState.innerText = "Not  registered";
        }
    });
}

function checkIfVideoHasSubtitleInStorage() {
    chrome.storage.local.get(videoSrcHash, function (result) {
        if (result[videoSrcHash]) {
            setCurrSubFileName(JSON.parse(result[videoSrcHash])["fileName"]);
            enableSyncControls();
        }
    })
}

function enableSyncControls() {
    document.querySelectorAll("#subtitle_controls input[data-seek]").forEach((elm, index) => {
        elm.disabled = false;
    });
}

function setCurrSubFileName(newName) {
    subtitleFileName = newName;
    document.getElementById("current_subtitle_file_name").innerText = newName;
    unloadSubBtn.disabled = false;
}

function readFile() {
    if (fileInput.files && fileInput.files[0]) {
        unloadCurrSubtitle();
        setCurrSubFileName(fileInput.files[0].name);
        detectEncoding().then(encoding => {
            console.log("selected encoding: " + encoding);
            var reader = new FileReader();

            reader.onload = function (e) {
                // e = ProgressEvent
                // e.target = FileReader
                parseSRT(e.target.result);
            };

            reader.readAsText(fileInput.files[0], encoding);
        });
    } else {
        // TODO: show error message
        return false;
    }
    return true;
}

function detectEncoding() {
    if (!fileInput.files || !fileInput.files[0]) return;

    return new Promise(resolve => {
        if (manEncodingCheckbox.checked) {
            // is selected manually?
            var selectedEncoding = document.getElementById("manual_encoding_input").value.trim();
            if (selectedEncoding.length > 0)
                resolve(selectedEncoding);
            else
                resolve(document.getElementById("encoding_select").value);

        } else {
            // else detect

            var detectRes;
            var reader = new FileReader();

            reader.onload = (e) => {
                var arrayBuffer = e.target.result;
                var bytes = new Uint8Array(arrayBuffer);
                detectRes = detect(bytes);
                /**
                 * detectRes sample:
                 * [ CharsetMatch {
             *       confidence: 44.92058548738711,
             *       charsetName: 'windows-1256',
             *       lang: 'ar' }, ...
                 *  ]
                 */

                // set DOM elements related to detected encoding
                document.getElementById("detected_encoding").style.visibility = "visible";
                document.querySelector("#detected_encoding_charset").innerText = detectRes[0]["charsetName"];
                document.querySelector("#detected_encoding_lang").innerText = detectRes[0]["lang"];
                document.querySelector("#detected_encoding_confidence").innerText = Math.round(detectRes[0]["confidence"]) + "%";

                resolve(detectRes[0]["charsetName"]);
            };
        }

        reader.readAsArrayBuffer(fileInput.files[0]);
    });
}

function timeToMs(hour, min, sec, ms) {
    hour = parseInt(hour);
    min = parseInt(min);
    sec = parseInt(sec);
    ms = parseInt(ms);

    if (isNaN(hour)) hour = 0;
    if (isNaN(min)) min = 0;
    if (isNaN(sec)) sec = 0;
    if (isNaN(ms)) ms = 0;

    return ms +
        sec * 1000 +
        min * 60000 +
        hour * 3600000;
}

function parseSRT(srt) {
    // parse srt
    const timeRegex = /(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)/g;
    //                 1      2      3      4            5      6      7      8
    srt = srt.split("\n");

    let subtitles = []; // [{start:...ms, end:...ms, subtitle: ...}, ...]
    let text = "";
    let curr = -1;
    let last_start;
    let last_end;
    let line;

    for (let i = 0; i < srt.length; i++) {
        line = srt[i].trim();

        // discards number
        if (line.match(/^(\d+)$/g)) {
            continue;
        }

        let match = timeRegex.exec(line);
        if (match) {
            if (curr != -1) {
                // save last 
                subtitles[curr] = {
                    start: last_start,
                    end: last_end,
                    text: text
                };
            }

            last_start = timeToMs(match[1], match[2], match[3], match[4]);
            last_end = timeToMs(match[5], match[6], match[7], match[8]);
            text = "";
            curr += 1;
        } else {
            // adding subtitle text
            if (line.length > 0)
                text += line + "<br>";
        }
    }

    // add last subtitle
    subtitles[curr] = {
        start: last_start,
        end: last_end,
        text: text
    };

    // save subtitle for this video in storage
    let toSave = {};
    toSave[videoSrcHash] = JSON.stringify({
        "fileName": subtitleFileName,
        "subtitles": subtitles
    });
    chrome.storage.local.set(toSave, function () {
        // when done saving
        // send them to content script
        chrome.tabs.sendMessage(activeTabId, {action: "srtParsed", subtitles: subtitles});
        enableSyncControls();
    });
}

function seek(value) {
    // value in ms
    chrome.tabs.sendMessage(activeTabId, {action: "seekSubtitle", amount: value}, function (response) {
        subtitleSeek.innerText = response.seekedValue
    });
}

function unloadCurrSubtitle() {
    unloadSubBtn.disabled = true;
    setCurrSubFileName("None");

    // delete from storage
    if (videoSrcHash === null || videoSrcHash === undefined) // double check
        return;
    chrome.storage.local.remove(videoSrcHash);

    // Send message to active tab to hide subtitle
    chrome.tabs.sendMessage(activeTabId, {action: "unloadCurrSubtitle"});
}
