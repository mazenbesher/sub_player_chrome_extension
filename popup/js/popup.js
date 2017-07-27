"use strict";

// Globals
var activeTabId;
var videoSrcHash;
var subtitleFileNames = {1: "", 2: "", 3: ""};

// for detecting encoding
var detect = require('charset-detector')

// set active tab id and search for video when the popup is opened
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    activeTabId = tabs[0].id;
    searchForVideos();
    setUpSeeks();
});

// seeks
var subtitleSeeks = {
    1: document.getElementById("subtitle_seek_1"),
    2: document.getElementById("subtitle_seek_2"),
    3: document.getElementById("subtitle_seek_3")
};

// hide encoding detection info
document.querySelectorAll(".detected_encoding").forEach(elm => elm.style.visibility = "hidden");

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
document.querySelectorAll(".unload_curr_subtitle").forEach(elm => {
    elm.disabled = true;
    elm.onclick = () => unloadSubtitle(elm.dataset.subtitleIndex);
});

// File input
document.querySelectorAll(".subtitle_file_input").forEach(elm => {
    elm.disabled = true;
    elm.onchange = readFile;
});

// Search btn
const searchBtn = document.getElementById("search_for_video_btn");
searchBtn.onclick = searchForVideos;

// Enable/Disable manual encoding selection
var manEncodingCheckboxes = {
    1: document.getElementById("manual_encoding_detection_1"),
    2: document.getElementById("manual_encoding_detection_2"),
    3: document.getElementById("manual_encoding_detection_3")
};
var manEncodingSections = {
    1: document.getElementById("manual_encoding_selection_1"),
    2: document.getElementById("manual_encoding_selection_2"),
    3: document.getElementById("manual_encoding_selection_3")
};

for (let index = 1; index <= 3; index++) {
    manEncodingSections[index].style.visibility = "hidden";

    manEncodingCheckboxes[index].onchange = () => {
        if (manEncodingCheckboxes[index].checked) {
            manEncodingSections[index].style.visibility = "visible";
        } else {
            manEncodingSections[index].style.visibility = "hidden";
        }
    };
}

// Body width based on current window width
// TODO: consider dynamic css instead (media queries [@min-width ...)
chrome.windows.getCurrent(w => { // w = current window
    document.querySelector("body").style.width = w.width / 2; // half the size of the window
});

// Sync listeners
for (let index = 1; index <= 3; index++) {
    const selector = `#subtitle_controls_${index} input[data-sync-amount]`;
    document.querySelectorAll(selector).forEach(elm => {
        elm.onclick = () => seek(parseInt(elm.dataset.syncAmount), index);
        elm.disabled = true;
    });
}

function setUpSeeks() {
    for (let index = 1; index <= 3; index++) {
        chrome.tabs.sendMessage(activeTabId, {action: "getSubSeek", index: index}, function (response) {
            if (response != undefined && response.seeked) {
                subtitleSeeks[index].innerText = response.amount;
            }
        });
    }
}

function searchForVideos() {
    chrome.tabs.sendMessage(activeTabId, {action: "searchForVideos"}, function (response) {
        if (response != undefined && response.videoDetected) { // NOTE: response can be undefined if none of the content scripts (possibly in multiple frames) detected a video -> no response is sent back
            videoSrcHash = response["videoSrcHash"];
            videoFound();
        }
    });
}

function videoFound() {
    // enable search button
    searchBtn.disabled = true;

    // enable file inputs
    document.querySelectorAll(".subtitle_file_input").forEach(
        elm => elm.disabled = false
    );

    // check storage to show file name
    checkIfVideoHasSubtitleInStorage();

    // playback key registration
    regKeyEventsBtn.disabled = false;
    checkIfKeyEventsAreRegistered();
}

function checkIfKeyEventsAreRegistered() {
    chrome.tabs.sendMessage(activeTabId, {action: "getRegKeyEventsState"}, function (response) {
        if (response.registered) {
            regKeyEventsState.innerText = "registered!";
            regKeyEventsBtn.disabled = true;
        } else {
            regKeyEventsState.innerText = "Not registered";
        }
    });
}

function checkIfVideoHasSubtitleInStorage() {
    for (let index = 1; index <= 3; index++) {
        const key = `${videoSrcHash}_${index}`;
        chrome.storage.local.get(key, function (result) {
            if (result[key]) {
                setCurrSubFileName(JSON.parse(result[key])["fileName"], index);
                enableSyncControls(index);

                // enable file input buttons
                document.getElementById("subtitle_file_input_" + index).disabled = false;
            }
        })
    }
}

function enableSyncControls(index) {
    const selector = `#subtitle_controls_${index} input[data-sync-amount]`;
    document.querySelectorAll(selector).forEach((elm, index) => {
        elm.disabled = false;
    });
}

function setCurrSubFileName(newName, index) {
    subtitleFileNames[index] = newName;

    const id = `current_subtitle_file_name_${index}`;
    document.getElementById(id).innerText = newName;

    // enable unload sub button
    const selector = `.unload_curr_subtitle[data-subtitle-index="${index}"`;
    document.querySelector(selector).disabled = false;
}

function readFile() {
    // this === input element
    if (this.files && this.files[0]) {
        const index = this.dataset.subtitleIndex;
        unloadSubtitle(index);
        setCurrSubFileName(this.files[0].name, index);
        detectEncoding(this, index).then(encoding => {
            console.log("selected encoding: " + encoding);
            var reader = new FileReader();

            reader.onload = e => {
                // e = ProgressEvent
                // e.target = FileReader
                parseSRT(e.target.result, index);
            };

            reader.readAsText(this.files[0], encoding);
        });
    } else {
        // TODO: show error message
        return false;
    }
    return true;
}

function detectEncoding(inputElm, index) {
    if (!inputElm.files || !inputElm.files[0]) return;

    function setDetectedEncoding(detectRes) {
        const containerId = `detected_encoding_${inputElm.dataset.subtitleIndex}`;
        document.getElementById(containerId).style.visibility = "visible";

        document.querySelector(`#${containerId} .detected_encoding_charset`).innerText = detectRes["charsetName"];
        document.querySelector(`#${containerId} .detected_encoding_lang`).innerText = detectRes["lang"];
        document.querySelector(`#${containerId} .detected_encoding_confidence`).innerText = Math.round(detectRes["confidence"]) + "%";
    }

    return new Promise(resolve => {
        if (manEncodingCheckboxes[index].checked) {
            // is selected manually?
            var selectedEncoding = document.getElementById("manual_encoding_input_" + index).value.trim();
            if (selectedEncoding.length > 0)
                resolve(selectedEncoding);
            else
                resolve(document.getElementById("encoding_select_" + index).value);

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
                setDetectedEncoding(detectRes[0]);

                resolve(detectRes[0]["charsetName"]);
            };
        }

        reader.readAsArrayBuffer(inputElm.files[0]);
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

function parseSRT(srt, index) {
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

    // save subtitle for this video in storage and notify content script to load it
    saveAndNotify(subtitles, index);
}

function saveAndNotify(subtitles, index) {
    let toSave = {};
    let key = `${videoSrcHash}_${index}`; // hash_index
    toSave[key] = JSON.stringify({
        "fileName": subtitleFileNames[index],
        "subtitles": subtitles
    });
    chrome.storage.local.set(toSave, function () {
        // when done saving
        // send them to content script
        chrome.tabs.sendMessage(activeTabId, {action: "srtParsed", subtitles: subtitles, index: index});
        enableSyncControls(index);
    });
}

function seek(value, index) {
    console.log(`request seeking index: ${index}, value: ${value}`);
    // value in ms
    chrome.tabs.sendMessage(activeTabId, {action: "seekSubtitle", index: index, amount: value}, function (response) {
        subtitleSeeks[index].innerText = response.seekedValue
    });
}

function unloadSubtitle(index) {
    // disable unload sub button
    const selector = `.unload_curr_subtitle[data-subtitle-index="${index}"`;
    document.querySelector(selector).disabled = false;

    // set file name
    setCurrSubFileName("None", index);

    // delete from storage
    if (videoSrcHash === null || videoSrcHash === undefined) // double check
        return;
    let key = `${videoSrcHash}_${index}`;
    chrome.storage.local.remove(key);

    // Send message to active tab to hide subtitle
    chrome.tabs.sendMessage(activeTabId, {action: "unloadSubtitle", index: index});
}
