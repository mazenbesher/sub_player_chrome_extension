// Globals
var reader = new FileReader();
var activeTabId;
var videoSrcHash;
var subtitleFileName;

// set active tab id and search for video when the popup is opened
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    activeTabId = tabs[0].id;
    searchForVideos();
});

// DOM
const currSubNameSpan = document.getElementById("current_subtitle_file_name");
const subtitleControls = document.getElementById("subtitle_controls");

// state and register keyboard events for video playback
const regKeyEventsState = document.getElementById("reg_keyboard_event_state");
const regKeyEventsBtn = document.getElementById("reg_keyboard_event");
regKeyEventsBtn.disabled = true; // enable if video found
regKeyEventsBtn.onclick = () => {
    chrome.tabs.sendMessage(activeTabId, {action: "regKeyboardEventForVideoPlayback"});
    regKeyEventsBtn.disabled = true;
    regKeyEventsState.innerText = "registered!";
};

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

const fileInput = document.getElementById("subtitle_file_input");
fileInput.disabled = true;
fileInput.onchange = readFile;

const searchBtn = document.getElementById("search_for_video_btn");
searchBtn.onclick = searchForVideos;

// Seek listeners
document.querySelectorAll("#subtitle_controls input[data-seek]").forEach((elm, index) =>
    elm.onclick = () => seek(parseInt(elm.getAttribute("data-seek")))
);

function searchForVideos() {
    chrome.tabs.sendMessage(activeTabId, {action: "searchForVideos"}, function (response) {
        if (response != undefined && response.videoDetected) { // NOTE: response can be undefined if none of the content scripts (possibly in multiple frames) detected a video -> no response is sent back
            fileInput.disabled = false;
            searchBtn.disabled = true;
            videoSrcHash = response["videoSrcHash"];
            checkIfVideoHasSubtitleInStorage();

            regKeyEventsBtn.disabled = false;
            checkIfKeyEventsAreRegistered();
        }
    });
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
        }
    })
}

function setCurrSubFileName(newName) {
    subtitleFileName = newName;
    currSubNameSpan.innerText = newName;
    unloadSubBtn.disabled = false;
}

function readFile() {
    unloadCurrSubtitle();

    if (fileInput.files && fileInput.files[0]) {
        setCurrSubFileName(fileInput.files[0].name);
        reader.onload = function (e) {
            parseSRT(e.target.result);
        };
        reader.readAsText(fileInput.files[0]);
    } else
        return false;
    return true;
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
    /* 
     * TODO: doesn't work! every time popup clicked it will load newly (Solution: sessionStorage)
     * Search Google: chrome extension save popup state
     // delete unnecessary inputs
     fileInput.remove();
     searchBtn.remove();
     */

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

        // show subtitle controls
        // subtitleControls.style.visibility = "visible";
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
    setCurrSubFileName("");

    // delete from storage
    if (videoSrcHash === null || videoSrcHash === undefined) // double check
        return;

    chrome.storage.local.remove(videoSrcHash);

    // Send message to active tab to hide subtitle
    chrome.tabs.sendMessage(activeTabId, {action: "unloadCurrSubtitle"});
}
