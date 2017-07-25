// Created DOM Elements
var subtitleContainer;
var subtitleHolder;
var videoElm = null;

// Config
const CHECK_VIDEO_RESIZE_MS = 1000;

// Globals
var subtitleSeekMS = 0;
var lastSubIndex = -1;
var videoSrcHash;

// Parsing globals
var subtitles = []

// Listeners
chrome.runtime.onMessage.addListener(receivedMessage);

// Main
videoElm = document.querySelector("video"); // <-- set here 
if (videoElm != null) {
    videoSrcHash = md5(videoElm.currentSrc);
    checkIfVideoHasSubtitleInStorage();
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
    let currTime = ~~(videoElm.currentTime * 1000) + subtitleSeekMS; // from sec to ms -> * 1000
    let currIndex = subtitles.findIndex(elm => currTime >= elm.start && currTime <= elm.end);
    if (currIndex != -1 && currIndex != lastSubIndex) {
        lastSubIndex = currIndex;
        subtitleHolder.innerHTML = subtitles[currIndex].text; // NOTE: should be html, since srt includes html tag such as <i> and new lines are added as <br> tags

        // is video resized
        if (subtitleContainer.clientHeight != videoElm.clientHeight)
            videoResized();
    } else if (currIndex == -1) {
        subtitleHolder.innerText = "";
    }
}

function receivedMessage(request, sender, sendResponse) {
    if (request.srtParsed) {
        if (videoElm !== null) { // NOTE: page can include multiple frames but only one should have the video in it
            subtitles = request.subtitles;
            displaySRT();
        }
    }
    else if (request.seek) {
        if (videoElm !== null) {
            subtitleSeekMS += request.seek;
            sendResponse({ seekedValue: subtitleSeekMS });
        }
    }
    else if (request.searchForVideos) {
        if (videoElm !== null) {
            sendResponse({
                videoDetected: true,
                "videoSrcHash": videoSrcHash
            });
        }
    }
    else if (request.seekedSubtitle) {
        if (videoElm !== null) {
            sendResponse({ seeked: true, amount: subtitleSeekMS });
        }
    }
    else if (request.unloadCurrSubtitle) {
        if (videoElm != null) {
            unloadCurrSubtitle();
        }
    }
}

function unloadCurrSubtitle() {
    subtitleHolder.remove();
    subtitleContainer.remove();
}

function displaySRT() {
    // subtitle container
    subtitleContainer = document.createElement("div");
    subtitleContainer.id = "subtitle_container";

    // make it as overlay
    subtitleContainer.style.height = videoElm.style.height;

    // add subtitle container (before video)
    videoElm.parentElement.insertBefore(subtitleContainer, videoElm);

    // add subtitle holder
    subtitleHolder = document.createElement("p");
    subtitleHolder.id = "subtitle_holder";
    subtitleHolder.style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
    subtitleHolder.style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) + "px";
    subtitleContainer.appendChild(subtitleHolder);

    // add event listener for video
    videoElm.ontimeupdate = showSubtitle;
    // videoElm.onwebkitfullscreenchange = videoResized;
}

function videoResized() {
    subtitleContainer.style.height = ~~(parseInt(videoElm.clientHeight)) + "px";;
    subtitleHolder.style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
    subtitleHolder.style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) + "px";
}

function checkIfVideoHasSubtitleInStorage() {
    if (videoElm === null) return; // double check

    chrome.storage.local.get(videoSrcHash, function (result) {
        if (result[videoSrcHash]) {
            subtitles = JSON.parse(result[videoSrcHash])["subtitles"];
            displaySRT();
        }
    })
}

