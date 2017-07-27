"use strict";

// Created DOM Elements
var subtitleContainer;
var subtitleHolders = {1: undefined, 2: undefined, 3: undefined};
var videoElm = null;

// Config
const CHECK_VIDEO_RESIZE_MS = 1000;

// Globals
var subtitleSeeks = {1: 0, 2: 0, 3: 0};
var lastSubIndexes = {1: -1, 2: -1, 3: -1};
var videoSrcHash;
var registeredKeyboardEventsForVideoPlayback = false;

// Parsing globals
var subtitles = {1: undefined, 2: undefined, 3: undefined};

// Listeners
chrome.runtime.onMessage.addListener(receivedMessage);

// Main
var videoElm = document.querySelector("video"); // <-- set here
if (videoElm != null) {
    videoSrcHash = md5(videoElm.currentSrc);
    checkIfVideoHasSubtitleInStorage();
    displaySubtitleElements();
}

// Inject css
// var style = document.createElement('link');
// style.rel = 'stylesheet';
// style.type = 'text/css';
// style.href = chrome.extension.getURL('contentscript/contentscript.css');
// (document.head||document.documentElement).appendChild(style);

/* NOTE: How align subtitle to bottom of subtitle container
 * set height of subtitleContainer to match video height
 * set display of subtitleContainer to table
 * set display of subtitleHolder to table-cell and vertical-align to bottom
 * add some bottom padding to the subtitleHolder
 * see: https://stackoverflow.com/a/13586293
 */

function showSubtitle(event) {
    let newSubtitle = false;

    for (let index = 1; index <= 3; index++) {
        if (!isSubtitleActive(index)) continue;
        let currTime = ~~(videoElm.currentTime * 1000) + subtitleSeeks[index]; // from sec to ms -> * 1000
        let currIndex = subtitles[index].findIndex(elm => currTime >= elm.start && currTime <= elm.end);
        if (currIndex != -1 && currIndex != lastSubIndexes[index]) {
            lastSubIndexes[index] = currIndex;
            subtitleHolders[index].innerHTML = subtitles[index][currIndex].text; // NOTE: should be html, since srt includes html tag such as <i> and new lines are added as <br> tags
            newSubtitle = true;
        } else if (currIndex == -1) {
            subtitleHolders[index].innerText = "";
        }
    }

    if (newSubtitle) {
        // is video resized
        if (subtitleContainer.clientHeight != videoElm.clientHeight ||
            subtitleContainer.clientWidth != videoElm.clientWidth)
            videoResized();
    }
}

function receivedMessage(request, sender, sendResponse) {
    if (videoElm === null) return;// NOTE: page can include multiple frames but only one should have the video in it
    if (!request.action || !request.hasOwnProperty("action")) return;

    switch (request.action) {
        case "srtParsed":
            subtitles[request.index] = request.subtitles;
            subtitleHolders[request.index].style.visibility = "visible";
            adjustSubtitlesWidths();
            break;

        case "seekSubtitle":
            subtitleSeeks[request.index] += request.amount;
            sendResponse({seekedValue: subtitleSeeks[request.index]});
            break;

        case "getSubSeek":
            sendResponse({seeked: true, amount: subtitleSeeks[request.index]});
            break;

        case "searchForVideos":
            sendResponse({
                videoDetected: true, // else we had already returned at the start of this method
                "videoSrcHash": videoSrcHash
            });
            break;

        case "unloadSubtitle":
            subtitleHolders[request.index].style.visibility = "hidden";
            subtitles[request.index] = undefined;
            adjustSubtitlesWidths();
            break;

        case "regKeyboardEventForVideoPlayback":
            regKeyEvents();
            break;

        case "getRegKeyEventsState":
            sendResponse({registered: registeredKeyboardEventsForVideoPlayback});
            break;
    }
}

function regKeyEvents() {
    if (registeredKeyboardEventsForVideoPlayback) return;
    registeredKeyboardEventsForVideoPlayback = true;

    document.addEventListener('keyup', (e) => {
        // e must be KeyboardEvent
        switch (e.key) {
            case "ArrowRight":
                if (e.ctrlKey) {
                    // 1 minute
                    videoElm.currentTime += 60;
                } else {
                    // 1 second
                    videoElm.currentTime += 5;
                }
                break;

            case "ArrowLeft":
                if (e.ctrlKey) {
                    // 1 minute
                    videoElm.currentTime -= 60;
                } else {
                    // 1 second
                    videoElm.currentTime -= 5;
                }
                break;
        }
    }, false);
}

function displaySubtitleElements() {
    // subtitle container
    subtitleContainer = document.createElement("div");
    subtitleContainer.id = "subtitle_container";

    // make it as overlay
    subtitleContainer.style.height = videoElm.style.height;

    // add subtitle container (before video)
    videoElm.parentElement.insertBefore(subtitleContainer, videoElm);

    // add subtitle holders
    for (let i = 1; i <= 3; i++) {
        subtitleHolders[i] = document.createElement("p");
        subtitleHolders[i].id = `subtitle_holder_${i}`;
        subtitleHolders[i].className += "subtitle_holder";
        subtitleHolders[i].style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
        subtitleHolders[i].style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) * i + "px";
        subtitleContainer.appendChild(subtitleHolders[i]);
    }

    // add event listener for video
    videoElm.ontimeupdate = showSubtitle;
    // videoElm.onwebkitfullscreenchange = videoResized;
}

function videoResized() {
    subtitleContainer.style.height = ~~(parseInt(videoElm.clientHeight)) + "px";
    subtitleContainer.style.width = videoElm.clientWidth;

    for (let i = 1; i <= 3; i++) {
        subtitleHolders[i].style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
        subtitleHolders[i].style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) + "px";
    }

    adjustSubtitlesWidths();
}

function checkIfVideoHasSubtitleInStorage() {
    if (videoElm === null) return; // double check

    // check all possible subtitles
    new Promise(() => {
        for (let index = 1; index <= 3; index++) {
            const key = `${videoSrcHash}_${index}`;
            chrome.storage.local.get(key, function (result) {
                if (result[key]) {
                    subtitles[index] = JSON.parse(result[key])["subtitles"];
                }
            })
        }
    }).then(() => {
        adjustSubtitlesWidths();
    })
}

function adjustSubtitlesWidths() {
    if (!videoElm) return;

    let numberOfEnabledSubtitles = 0;
    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index))
            numberOfEnabledSubtitles++;
    }
    if (numberOfEnabledSubtitles <= 0) return;

    console.info("adjusting subtitles widths");
    console.info("numberOfEnabledSubtitles: " + numberOfEnabledSubtitles);

    let videoWidth = videoElm.clientWidth;
    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index))
            subtitleHolders[index].style.width = videoWidth / numberOfEnabledSubtitles;
        else
            subtitleHolders[index].style.width = "0px";
    }
}

function isSubtitleActive(index) {
    return subtitles[index] !== undefined &&
        subtitles[index].length > 0;
}
