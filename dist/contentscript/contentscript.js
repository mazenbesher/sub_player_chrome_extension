"use strict";
const DEBUG = true;

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
/**
 * Note: Subtitle Custom events
 * sub-activated, sub-deactivated
 * dispatched when a subtitle is (de)activated
 * the (de)activated subtitle index can be found as the event detail
 */

// config
const VIDEO_SEARCH_INTERVAL_TIME = 1000; // each VIDEO_SEARCH_INTERVAL_TIME ms the method find video will be fired
const VIDEO_SEARCH_LIMIT = 10; // after VIDEO_SEARCH_LIMIT the video search interval will be removed
const INITIAL_SUBTITLES_COLORS = {1: "lightgray", 2: "lightcoral", 3: "lightblue"};

// style variables
let subFontSizeHeightRatios = {1: 15, 2: 15, 3: 15}; // font-size = video.clientHeight / subFontSizeHeightRatio
let subPadHeightRatios = {1: 36, 2: 36, 3: 36}; // padding-down = video.clientHeight / subPadHeightRatios

// Created DOM Elements
let subtitleContainer;
let subtitleHolders = {1: undefined, 2: undefined, 3: undefined};

// video pointer
let videoElm = null;
let videoSearchIntervall;
let searchCounter = 0;

// Globals
let subtitleSeeks = {1: 0, 2: 0, 3: 0};
let lastSubIndexes = {1: -1, 2: -1, 3: -1};
let registeredKeyboardEventsForVideoPlayback = false;
let subtitles = {1: undefined, 2: undefined, 3: undefined};
let isManualResizeActive = false;

// Listeners
chrome.runtime.onMessage.addListener(receivedMessage);
document.addEventListener('controls-show', controlsShown);
document.addEventListener('controls-hide', controlsHide);
document.addEventListener('sub-activated', subActivated);
document.addEventListener('sub-deactivated', subDeactivated);

// when done loading
window.addEventListener("load", main, false);

function main() {
    if (videoSearchIntervall == null)
        videoSearchIntervall = setInterval(findVideo, VIDEO_SEARCH_INTERVAL_TIME);
}

function controlsShown(e) {
    if (isManualResizeActive) return;

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
    if (isManualResizeActive) return;
    // log("controls are hidden");

    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index)) {
            const originalPadding = videoElm.clientHeight / subPadHeightRatios[index];
            $(subtitleHolders[index]).css('padding-bottom', `${originalPadding}px`);
        }
    }
}

function subActivated(e) {
    const index = e.detail;
    adjustBadgeToNumberOfActiveSubtitles();
}

function subDeactivated(e) {
    const index = e.detail;
    adjustBadgeToNumberOfActiveSubtitles();
}

function adjustBadgeToNumberOfActiveSubtitles() {
    const activeSubtitles = getNumberOfActiveSubtitles();
    if (activeSubtitles > 0)
        setBadgeText(activeSubtitles.toString(), "green");
    else if (activeSubtitles == 0)
        setBadgeText("");
}

function setBadgeText(text, color = "red") {
    chrome.runtime.sendMessage({action: "setBrowserActionBadge", text, color});
}

function showSubtitle(event) {
    let newSubtitle = false;

    for (let index = 1; index <= 3; index++) {
        if (!isSubtitleActive(index)) continue;
        let currTime = ~~(videoElm.currentTime * 1000) + subtitleSeeks[index]; // from sec to ms -> * 1000
        let currIndex = subtitles[index].findIndex(elm => currTime >= elm.start && currTime <= elm.end);
        if (currIndex != -1 && currIndex != lastSubIndexes[index]) {
            lastSubIndexes[index] = currIndex;
            // TODO innerHTML => security threat
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
            document.dispatchEvent(new CustomEvent('sub-activated', {detail: request.index}));
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
                "videoKey": getVideoKey()
            });
            break;

        case "unloadSubtitle":
            subtitleHolders[request.index].style.visibility = "hidden";
            subtitleHolders[request.index].innerText = "";
            subtitles[request.index] = undefined;
            document.dispatchEvent(new CustomEvent('sub-deactivated', {detail: request.index}));
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
            subFontSizeHeightRatios[request.index] = parseInt(request.newRatio);
            adjustSubtitlesFontAndPadding();
            break;

        case "getSubFontSize":
            sendResponse({newRatio: subFontSizeHeightRatios[request.index]});
            break;

        case "isAllSubSameFontSize":
            // is all equal?
            const value = subFontSizeHeightRatios[1];
            if (Object.values(subFontSizeHeightRatios).reduce((a, b) => (a === b) ? a : NaN) === value) {
                sendResponse({isAllSubSameFontSize: true, fontSize: value});
            } else {
                sendResponse({isAllSubSameFontSize: false});
            }
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

        // manual resize
        case "manualResizeState":
            sendResponse({state: isManualResizeActive});
            break;

        case "activatedManualResize":
            if (!isManualResizeActive) {
                // set state
                isManualResizeActive = true;

                // set subtitles inside handlers
                for (let index = 1; index <= 3; index++) {
                    $(`p#subtitle_holder_${index}`).detach().prependTo(`div#holder_container_${index}`);
                }


                // add listeners
                videoElm.addEventListener("pause", showResizeHandlers);
                videoElm.addEventListener("play", hideResizeHandlers);
            }
            break;

        case "deactivatedManualResize":
            if (isManualResizeActive) {
                hideResizeHandlers();
                setResizeHandlersClickable(false);

                // set state
                isManualResizeActive = false;

                // set subtitles outside handlers
                for (let index = 1; index <= 3; index++) {
                    $(`p#subtitle_holder_${index}`).detach().prependTo("#subtitle_container");

                    // make width zero else it will keep the last one and push contents
                    $(`holder_container_${index}`).width(0);
                }

                // remove listeners
                videoElm.removeEventListener("pause", showResizeHandlers);
                videoElm.removeEventListener("play", hideResizeHandlers);
            }
            break;

        case "getDocumentTitle":
            sendResponse({title: document.title});
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

function displaySubtitleElements(callback) {
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
        subtitleHolders[index].style.color = INITIAL_SUBTITLES_COLORS[index];

        let holderContainer = document.createElement("div");
        holderContainer.id = `holder_container_${index}`;
        holderContainer.dataset.subtitleIndex = index;
        $(holderContainer).addClass('resizable');
        $(holderContainer).addClass('draggable');
        $(holderContainer).addClass('holder-container');
        // holderContainer.appendChild(subtitleHolders[index]);

        // add size / drag handlers
        const classes = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        for (let c of classes) {
            let div = document.createElement('div');
            div.dataset.subtitleIndex = index;
            $(div).addClass('ui-resizable-handle');
            $(div).addClass(`ui-resizable-${c}`);
            holderContainer.appendChild(div);
        }

        subtitleContainer.appendChild(holderContainer);
        subtitleContainer.appendChild(subtitleHolders[index]);
    }

    adjustSubtitlesFontAndPadding();

    // apply jquery effects to resize and drag
    applyResizalbeAndDraggable();

    // resize handlers
    // hide them
    $(`div.ui-resizable-handle`).hide();
    $(`div.holder-container`).css("border", "none");
    setResizeHandlersClickable(false);

    callback();
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
            const key = getVideoKey(index);
            chrome.storage.local.get(key, function (result) {
                if (result[key]) {
                    subtitles[index] = JSON.parse(result[key])["subtitles"];
                    document.dispatchEvent(new CustomEvent('sub-activated', {detail: index}));
                }
            })
        }
    }).then(() => {
        adjustSubtitlesWidths();
    })
}

function getNumberOfActiveSubtitles() {
    let result = 0;
    for (let index = 1; index <= 3; index++) {
        if (isSubtitleActive(index))
            result++;
    }
    return result;
}

function adjustSubtitlesWidths() {
    if (!videoElm) return;

    let numberOfEnabledSubtitles = getNumberOfActiveSubtitles();
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
    if (searchCounter > VIDEO_SEARCH_LIMIT) {
        log("counter is up...");
        stopSearching();
    }
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
    // notify bg that a content script has found a video
    chrome.runtime.sendMessage({action: "scriptHasFoundVideo"});

    // i.e. videoElm != null
    stopSearching();

    // notify other content scripts on this tab to stop searching
    chrome.runtime.sendMessage({action: "stopSearching"});

    checkIfVideoHasSubtitleInStorage();
    displaySubtitleElements(doneLoadingSubtitleElements);
}

function doneLoadingSubtitleElements() {
    // add event listener for video
    videoElm.ontimeupdate = showSubtitle;
    // videoElm.onwebkitfullscreenchange = videoResized;

    // observe video style changes
    let videoStyleAttrObserver = new MutationObserver(mutations => {
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
    });
    videoStyleAttrObserver.observe(videoElm, {attributes: true, attributeFilter: ['style']});

    if (videoElm.controls) {
        addControlsListeners()
    } else {
        // observer for controls attribute in html5 video (to push subtitle if active through events)
        let videoControlsObserver = new MutationObserver(mutations => {
            if (videoElm.controls) {
                addControlsListeners()
            }
        });
        videoControlsObserver.observe(videoElm, {attributes: true, attributeFilter: ['controls']});
    }
}

function addControlsListeners() {
    const controlsHeight = 25; // magic number

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

function stopSearching() {
    clearInterval(videoSearchIntervall);
}

function getVideoKey(index) {
    // old
    // const url = location.href;
    // const videoSrc = videoElm.currentSrc;
    // const videoKey = md5(`${url}_${videoSrc}`);

    // new
    const videoKey = md5(`${location.href}`);

    if (index)
        return `${videoKey}_${index}`;
    else
        return `${videoKey}`;
}

function log(msg) {
    if (!DEBUG) return;

    chrome.runtime.sendMessage({
        action: "globalLogger",
        sender: "contentscript",
        msg
    });
}

function applyResizalbeAndDraggable(index) {
    $(`.resizable`).resizable({
        handles: {
            'nw': '.ui-resizable-nw',
            'ne': '.ui-resizable-ne',
            'sw': '.ui-resizable-sw',
            'se': '.ui-resizable-se',
            'n': '.ui-resizable-n',
            'e': '.ui-resizable-e',
            's': '.ui-resizable-s',
            'w': '.ui-resizable-w'
        }
    });

    $(`.draggable`).draggable();
}

function showResizeHandlers(e) {
    if (!isManualResizeActive) return;
    setResizeHandlersClickable(true);

    for (let index = 0; index <= 3; index++) {
        if (isSubtitleActive(index)) {
            $(`div.ui-resizable-handle[data-subtitle-index="${index}"]`).show();
            $(`div.holder-container[data-subtitle-index="${index}"]`).css("border", "1px dashed rgba(0, 0, 0, 1)");
        }
    }
}

function hideResizeHandlers(e) {
    if (!isManualResizeActive) return;
    setResizeHandlersClickable(false);

    $(`div.ui-resizable-handle`).hide();
    $(`div.holder-container`).css("border", "1px dashed rgba(0, 0, 0, 0)");
}

function setResizeHandlersClickable(isClickable) {
    if (isClickable) {
        $(".subtitle_holder").addClass("enable-click");
        $(".subtitle_holder").removeClass("disable-click");

        $(`div.ui-resizable-handle`).addClass("enable-click");
        $(`div.ui-resizable-handle`).removeClass("disable-click");
    } else {
        $(".subtitle_holder").removeClass("enable-click");
        $(".subtitle_holder").addClass("disable-click");

        $(`div.ui-resizable-handle`).removeClass("enable-click");
        $(`div.ui-resizable-handle`).addClass("disable-click");
    }
}
