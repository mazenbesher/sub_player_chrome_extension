"use strict";

// Notes
/**
 * Note: Inject css
 * var style = document.createElement('link');
 * style.rel = 'stylesheet';
 * style.type = 'text/css';
 * style.href = chrome.extension.getURL('contentscript/contentscript.css');
 * (document.head||document.documentElement).appendChild(style);
 */
/**
 * Note: How align subtitle to bottom of subtitle container
 * set height of subtitleContainer to match video height
 * set display of subtitleContainer to table
 * set display of subtitleHolder to table-cell and vertical-align to bottom
 * add some bottom padding to the subtitleHolder
 * see: https://stackoverflow.com/a/13586293
 */
/**
 * Note: Custom events for video controls
 *
 * 1. controls-show: if controls are shown
 * e.detail = height
 * handler: controlsShown
 *
 * 2. controls-hide: if controls are hidden
 * handler: controlsHide
 */

// config
const CS_ID = md5(new Date().getTime());
const VIDEO_SEARCH_INTERVAL_TIME = 1000; // each VIDEO_SEARCH_INTERVAL_TIME ms the method find video will be fired
const VIDEO_SEARCH_LIMIT = 10; // after VIDEO_SEARCH_LIMIT the video search interval will be removed
const initalSubtitlesColors = {
    1: "white",
    2: "lightcoral",
    3: "lightblue"
};

// style variables
let subFontSizeHeightRatios = [15, 15, 15]; // font-size = video.clientHeight / subFontSizeHeightRatio
let subPadHeightRatios = [36, 36, 36]; // padding-down = video.clientHeight / subPadHeightRatios

// Created DOM Elements
let subtitleContainer;
let subtitleHolders = {1: undefined, 2: undefined, 3: undefined};

// video pointer
let videoElm = null;
let videoSearchIntervall;
let searchCounter = 0;

// Globals
let currentTabId = null;
let subtitleSeeks = {1: 0, 2: 0, 3: 0};
let lastSubIndexes = {1: -1, 2: -1, 3: -1};
let videoSrcHash;
let registeredKeyboardEventsForVideoPlayback = false;
let subtitles = {1: undefined, 2: undefined, 3: undefined};

// Listeners
chrome.runtime.onMessage.addListener(receivedMessage);
document.addEventListener('controls-show', controlsShown);
document.addEventListener('controls-hide', controlsHide);

// when done loading
window.addEventListener("load", main, false);

function main() {
    if (videoSearchIntervall == null)
        videoSearchIntervall = setInterval(findVideo, VIDEO_SEARCH_INTERVAL_TIME);
}

function controlsShown(e) {
    const controlsHeight = e.detail;
    // log(`Controls are show with height ${controlsHeight}`);

    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index)) {
            const originalPadding = videoElm.clientHeight / subPadHeightRatios[index];

            if (controlsHeight > originalPadding) {
                const newPadding = originalPadding + controlsHeight;
                $(subtitleHolders[index]).css('padding-bottom', `${newPadding}px`);
            }
        }
    }
}

function controlsHide(e) {
    // log("controls are hidden");

    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index)) {
            const originalPadding = videoElm.clientHeight / subPadHeightRatios[index];
            $(subtitleHolders[index]).css('padding-bottom', `${originalPadding}px`);
        }
    }
}

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
        log("new subtitle");
        // is video resized
        if (subtitleContainer.clientHeight != videoElm.clientHeight ||
            subtitleContainer.clientWidth != videoElm.clientWidth)
            videoResized();
    }
}

function receivedMessage(request, sender, sendResponse) {
    // log("message sent to content script is received, request: ", request);
    if (!request.action || !request.hasOwnProperty("action")) return;

    // if other script has found the video stop searching
    if (request.action == "stopSearching") {
        log("other cs has found the video! stopping searching");
        stopSearching();
        return;
    }

    if (videoElm === null) return;// NOTE: page can include multiple frames but only one should have the video in it

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

        // sub font size
        case "changeSubFontSizeRatio":
            subFontSizeHeightRatios[request.index] = request.newRatio;
            adjustSubtitlesFontAndPadding();
            break;

        case "getSubFontSize":
            sendResponse({newRatio: subFontSizeHeightRatios[request.index]});
            break;

        // sub color
        case "getSubColor":
            sendResponse({color: subtitleHolders[request.index].style.color});
            break;

        case "setSubColor":
            subtitleHolders[request.index].style.color = request.color;
            break;

        // sub padding
        case "setSubPadding":
            subPadHeightRatios[request.index] = request.newRatio;
            adjustSubtitlesFontAndPadding();
            break;

        case "getSubPadding":
            sendResponse({newRatio: subPadHeightRatios[request.index]});
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
    for (let index = 1; index <= 3; index++) {
        subtitleHolders[index] = document.createElement("p");
        subtitleHolders[index].id = `subtitle_holder_${index}`;
        subtitleHolders[index].className += "subtitle_holder";
        subtitleHolders[index].style.color = initalSubtitlesColors[index];
        subtitleContainer.appendChild(subtitleHolders[index]);
    }
    adjustSubtitlesFontAndPadding();

    // add event listener for video
    videoElm.ontimeupdate = showSubtitle;
    // videoElm.onwebkitfullscreenchange = videoResized;

    // observe video style changes
    //  docs: https://developer.mozilla.org/en/docs/Web/API/MutationObserver#MutationObserverInit
    let videoStyleAttrObserver = new MutationObserver(videoStyleChanged);
    videoStyleAttrObserver.observe(videoElm, {attributes: true, attributeFilter: ['style']});
}

function adjustSubtitlesFontAndPadding() {
    for (let index = 1; index <= 3; index++) {
        subtitleHolders[index].style.fontSize = videoElm.clientHeight / subFontSizeHeightRatios[index] + "px";
        subtitleHolders[index].style.paddingBottom = videoElm.clientHeight / subPadHeightRatios[index] + "px";
    }
}

function videoResized() {
    log("video resized");

    subtitleContainer.style.height = videoElm.clientHeight + "px";
    subtitleContainer.style.width = videoElm.clientWidth + "px";
    adjustSubtitlesFontAndPadding();
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

    log("adjusting subtitles widths");
    log("numberOfEnabledSubtitles: " + numberOfEnabledSubtitles);

    let videoWidth = videoElm.clientWidth;
    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index)) {
            subtitleHolders[index].style.width = videoWidth / numberOfEnabledSubtitles + "px";
        }
        else {
            subtitleHolders[index].style.width = "0px";
            subtitleHolders[index].innerText = "";
        }
    }
}

function isSubtitleActive(index) {
    return subtitles[index] !== undefined &&
        subtitles[index].length > 0;
}

function findVideo() {
    log(`searching for a video... ${searchCounter}`);
    videoElm = document.querySelector("video"); // <-- set here
    if (videoElm != null) {
        log("found a video! stopping searching");
        videoFound();
        return;
    }

    searchCounter++;
    if (searchCounter > VIDEO_SEARCH_LIMIT)
        stopSearching();
}

function videoStyleChanged(mutations) {
    log("video style changed!")
    mutations.forEach(mutationRecord => {
        // type of mutationRecord = MutationRecord
        // docs: https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord

        // assign new video style attributes to the subtitle container
        // type of videoElm.style = CSSStyleDeclaration
        subtitleContainer.style.cssText = videoElm.style.cssText;
        adjustSubtitlesFontAndPadding();
        adjustSubtitlesWidths();
    })
}

function addMultipleListeners(element, events, handler, useCapture, args) {
    if (!(events instanceof Array)) {
        throw 'addMultipleListeners: ' +
        'please supply an array of eventstrings ' +
        '(like ["click","mouseover"])';
    }
    //create a wrapper to be able to use additional arguments
    var handlerFn = function (e) {
        handler.apply(this, args && args instanceof Array ? args : []);
    }
    for (var i = 0; i < events.length; i += 1) {
        element.addEventListener(events[i], handlerFn, useCapture);
    }
}

function videoFound() {
    // i.e. videoElm != null
    stopSearching();

    // notify other content scripts on this tab to stop searching
    chrome.runtime.sendMessage({action: "stopSearching"});

    videoSrcHash = md5(videoElm.currentSrc);
    checkIfVideoHasSubtitleInStorage();
    displaySubtitleElements();

    if (videoElm.controls) {// -> html5 video, we must not detect controls manually
        const controlsHeight = videoElm.videoHeight / 10; // magic number

        // if video paused or mouse over it -> controls are shown
        addMultipleListeners(videoElm, ['pause', 'mouseover'], () => {
            document.dispatchEvent(new CustomEvent('controls-show', {detail: controlsHeight}));
        }, false);

        // if mouse out and playing OR playing alone -> controls are hidden
        addMultipleListeners(videoElm, ['playing', 'play', 'mouseout'], () => {
            if (!videoElm.paused)
                document.dispatchEvent(new CustomEvent('controls-hide'))
        }, false);
    }
}

function stopSearching() {
    clearInterval(videoSearchIntervall);
}

function log(msg) {
    console.log(`${CS_ID}: ${msg}`)
}
