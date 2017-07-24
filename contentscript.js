// Created DOM Elements
var subtitleContainer;
var subtitleHolder;
var videoElm = null;

// Globals
var lastIndex = -1;
var subtitleSeekMS = 0;

// Parsing globals
var subtitles = []
var times = []

// Listeners
// chrome.runtime.onConnect.addListener(detectVideos);
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

    if (currTime > times[1]) { // times[0] == undefined
        let currIndex = times.findIndex(elm => elm > currTime);
        if (currIndex != -1 && currIndex != lastIndex) {
            // new subtitle
            subtitleHolder.innerText = subtitles[currIndex];
            lastIndex = currIndex;
        }
    }
}

// function detectVideos(port) {
//     videoElm = document.querySelector("video");
//     console.log("videoElm: ");
//     console.log(videoElm);
// }

function receivedMessage(request, sender, sendResponse) {
    // console.log("message received");
    // console.log(request);
    // console.log(sender);

    if (request.srtUploaded) {
        if (videoElm !== null) { // NOTE: page can include multiple frames but only one should have the video in it
            subtitles = request.subtitles;
            times = request.times;

            displaySRT();
        }
    }
    else if (request.seek) {
        if (videoElm !== null) {
            seek(request.seek)
        }
    }
    else if (request.searchForVideos) {
        videoElm = document.querySelector("video"); // <-- set here 

        if (videoElm !== null) {
            sendResponse({ videoDetected: true });
        }
    }
    else if(request.seekedSubtitle) {
        if (videoElm !== null) {
            sendResponse({seeked: true, amount: subtitleSeekMS});
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
    subtitleHolder.style.fontSize = "20px";
    subtitleHolder.style.fontWeight = "500";
    subtitleHolder.style.color = "white";
    subtitleHolder.style.textShadow = "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black ";
    subtitleHolder.style.paddingBottom = "10px";
    subtitleHolder.style.display = "table-cell";
    subtitleHolder.style.verticalAlign = "bottom";
    subtitleContainer.appendChild(subtitleHolder);

    // add event listener when video time update
    videoElm.ontimeupdate = showSubtitle;
}

function seek(value) {
    subtitleSeekMS += value;
}