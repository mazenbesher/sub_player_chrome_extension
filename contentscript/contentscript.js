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
var registeredKeyboardEventsForVideoPlayback = false;

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
    if (videoElm === null) return;// NOTE: page can include multiple frames but only one should have the video in it
    if (!request.action) return;

    switch (request.action) {
        case "srtParsed":
            subtitles = request.subtitles;
            displaySRT();
            break;

        case "seekSubtitle":
            subtitleSeekMS += request.amount;
            sendResponse({seekedValue: subtitleSeekMS});
            break;

        case "getSubSeek":
            sendResponse({seeked: true, amount: subtitleSeekMS});
            break;

        case "searchForVideos":
            sendResponse({
                videoDetected: true, // else we had already returned at the start of this method
                "videoSrcHash": videoSrcHash
            });
            break;

        case "unloadCurrSubtitle":
            unloadCurrSubtitle();
            break;

        case "regKeyboardEventForVideoPlayback":
            regKeyEvents();
            break;

        case "getRegKeyEventsState":
            sendResponse({registered: registeredKeyboardEventsForVideoPlayback});
            break;
    }
}

function regKeyEvents(){
    if(registeredKeyboardEventsForVideoPlayback) return;
    registeredKeyboardEventsForVideoPlayback = true;

    document.addEventListener('keyup', (e) => {
        // e must be KeyboardEvent
        switch (e.key){
            case "ArrowRight":
                videoElm.currentTime += 1; // in seconds
                break;

            case "ArrowLeft":
                videoElm.currentTime -= 1;
                break;
        }
    }, false);
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
    subtitleContainer.style.height = ~~(parseInt(videoElm.clientHeight)) + "px";
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

