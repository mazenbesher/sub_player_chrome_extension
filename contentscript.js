// Created DOM Elements
var subtitleContainer;
var subtitleHolder;
var videoElm = null;

// Config
const CHECK_VIDEO_RESIZE_MS = 1000;

// Globals
var subtitleSeekMS = 0;

// Parsing globals
var subtitles = []

// Listeners
chrome.runtime.onMessage.addListener(receivedMessage);

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
    if (currIndex != -1) {
        subtitleHolder.innerText = subtitles[currIndex].text;
    } else {
        subtitleHolder.innerText = "";
    }

    // if (currTime > times[1]) { // times[0] == undefined
    //     let currIndex = times.findIndex(elm => elm > currTime);
    //     if (currIndex != -1 && currIndex != lastIndex) {
    //         // new subtitle
    //         subtitleHolder.innerText = subtitles[currIndex];
    //         lastIndex = currIndex;
    //     }
    // }
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
        videoElm = document.querySelector("video"); // <-- set here 

        if (videoElm !== null) {
            sendResponse({ videoDetected: true });
        }
    }
    else if (request.seekedSubtitle) {
        if (videoElm !== null) {
            sendResponse({ seeked: true, amount: subtitleSeekMS });
        }
    }
}

function displaySRT() {
    // subtitle container
    subtitleContainer = document.createElement("div");
    subtitleContainer.id = "subtitle_container";

    // make it as overlay
    subtitleContainer.style.position = "absolute";
    subtitleContainer.style.width = "100%";
    subtitleContainer.style.zIndex = "300000";
    subtitleContainer.style.height = videoElm.style.height;
    subtitleContainer.style.display = "table";

    // add subtitle container (before video)
    videoElm.parentElement.insertBefore(subtitleContainer, videoElm);

    // add subtitle holder
    subtitleHolder = document.createElement("p");
    subtitleHolder.style.textAlign = "center";
    subtitleHolder.style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
    subtitleHolder.style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) + "px";
    subtitleHolder.style.fontWeight = "500";
    subtitleHolder.style.color = "white";
    subtitleHolder.style.textShadow = "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black ";
    subtitleHolder.style.display = "table-cell";
    subtitleHolder.style.verticalAlign = "bottom";
    subtitleContainer.appendChild(subtitleHolder);

    // add event listener for video
    videoElm.ontimeupdate = showSubtitle;
    setInterval(function(){
        if(subtitleContainer.clientHeight != videoElm.clientHeight)
            videoResized();
    }, CHECK_VIDEO_RESIZE_MS);
}

function videoResized() {
    console.log("video resized!");
    subtitleContainer.style.height = ~~(parseInt(videoElm.clientHeight)) + "px";;
    subtitleHolder.style.fontSize = ~~(parseInt(videoElm.clientWidth) / 32) + "px";
    subtitleHolder.style.paddingBottom = ~~(parseInt(videoElm.clientWidth) / 64) + "px";
}