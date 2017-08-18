"use strict";

// Notes
/**
 * Subtitle Custom events
 * sub-activated, sub-deactivated
 * dispatched when a subtitle is (de)activated
 * the (de)activated subtitle index can be found as the event detail
 */

// requires
const $ = require('jquery'); window.jQuery = $; // because it is required by bootstrap
const Popper = require('popper.js'); window.Popper = Popper; // because it is required by bootstrap
require('bootstrap');
require('lib/external/bootstrap-colorpicker.min.js');
const tinycolor = require('lib/external/tinycolor.min.js');
const detect = require('charset-detector'); // for detecting encoding

// imports
import { config } from 'lib/config';
import { getActiveTabId } from 'lib/utils';

// react
import React from 'react';
import ReactDOM from 'react-dom';
import { SubtitlesNavTabs } from './components/SubtitlesNavTabs';
import { SubtitlePaneContainer } from './components/SubtitlePaneContainer';
import { GeneralSection } from './components/GeneralSection';

// Globals
let activeTabId;
let videoKey;
let subtitleFileNames = { 1: "", 2: "", 3: "" };

// generate react components
ReactDOM.render(
    <div>
        <SubtitlesNavTabs />
        <SubtitlePaneContainer />
        <GeneralSection />
    </div>,
    document.getElementById("react_container")
);

// register global logger function and onerror
let log;
chrome.runtime.getBackgroundPage(bg => {
    log = msg => bg.globalLogger("popup", msg, config.popup.debugColor);
});
window.onerror = () => {
    chrome.runtime.getBackgroundPage(bg => {
        bg.globalWinOnerror("popup", config.popup.debugColor);
    })
};

// style: font-size slider
getActiveTabId().then(activeTabId => {
    // event listeners
    document.querySelectorAll(".font-size-slider").forEach(slider => {
        let sliderChangeHandler = (e) => {
            const index = e.target.dataset.subtitleIndex;
            setSubFontSize(index, document.querySelector(`#font_size_value_${index}`), e.target.value);
        };

        slider.oninput = sliderChangeHandler;
        slider.onchange = sliderChangeHandler;
        slider.disabled = true; // disabled at start
    });

    // event listeners when activate subtitles
    document.addEventListener('sub-activated', e => {
        let slider = document.querySelector(`.font-size-slider[data-subtitle-index="${e.detail}"]`);
        slider.disabled = false;

        // update span and slider
        chrome.tabs.sendMessage(activeTabId, {
            action: "getSubFontSize",
            index: e.detail
        }, response => {
            if (response !== null && response.newRatio) {
                document.querySelector(`#font_size_value_${e.detail}`).innerText = response.newRatio;
                slider.value = response.newRatio;
            }
        });
    });

    // event listeners when deactivate subtitles
    document.addEventListener('sub-deactivated', e => {
        document.querySelector(`.font-size-slider[data-subtitle-index="${e.detail}"]`).disabled = true;
    });
});

// style: bottom padding
getActiveTabId().then(activeTabId => {
    // event listeners
    document.querySelectorAll(".padding-down-slider").forEach(slider => {
        slider.oninput = setSubPadding;
        slider.onchange = setSubPadding;
        slider.disabled = true; // disabled at start
    });

    // event listeners when activate subtitles
    document.addEventListener('sub-activated', e => {
        let slider = document.querySelector(`.padding-down-slider[data-subtitle-index="${e.detail}"]`);
        slider.disabled = false;

        // update span and slider
        chrome.tabs.sendMessage(activeTabId, {
            action: "getSubPadding",
            index: e.detail
        }, response => {
            if (response !== null && response.newRatio) {
                document.querySelector(`#down_padding_value_${e.detail}`).innerText = response.newRatio;
                slider.value = response.newRatio;
            }
        });
    });

    // event listeners when deactivate subtitles
    document.addEventListener('sub-deactivated', e => {
        document.querySelector(`.padding-down-slider[data-subtitle-index="${e.detail}"]`).disabled = true;
    });
});

// style: font color pickers
getActiveTabId().then(activeTabId => {
    // https://farbelous.github.io/bootstrap-colorpicker/

    // functions
    let toHexString = color => {
        if (tinycolor(color).isValid())
            return tinycolor(color).toHexString();
        else
            throw new Error("invalid color");
    };

    let setTabColor = (color, index) => {
        const shadedColor = shadeColor(toHexString(color), .5);
        $(`#subtitles_nav_tabs > a[aria-controls="subtitle_${index}"]`).css("background-color", shadedColor);
        $(`div#subtitle_${index} .card`).css("background-color", shadedColor);
        $(`div#subtitle_${index} .unload_curr_subtitle`).css("background-color", color);
    };

    let getSubColor = (index) => {
        return new Promise(resolve => {
            chrome.tabs.sendMessage(activeTabId, { action: "getSubColor", index: index }, response => {
                if (response && response.color)
                    resolve(response.color);
            });
        });
    };

    let setSubColor = (color, index) => {
        setTabColor(color, index);
        chrome.tabs.sendMessage(activeTabId, {
            action: "setSubColor",
            color: color,
            index: index
        })
    };

    for (let index = 1; index <= 3; index++) {
        const cp = $(`#font_color_picker_${index}`);
        // set initial colors
        getSubColor(index).then(color => {
            setTabColor(color, index);
            cp.colorpicker({
                color: color,
                container: true,
                inline: true
            });
        });

        // on change color
        cp.on('changeColor', () => { // jQuery addEventListener
            setSubColor(cp.data('colorpicker').color.toHex(), index)
        });

        // disable until a sub is activated
        cp.css('visibility', 'hidden');
    }

    // event listeners
    document.addEventListener('sub-activated', e => {
        const index = e.detail;
        getSubColor(index).then(color => {
            const cp = $(`#font_color_picker_${index}`);
            cp.data('colorpicker').color.setColor(color);
            cp.css('visibility', 'visible');
        });
    });

    document.addEventListener('sub-deactivated', e => {
        $(`#font_color_picker_${e.detail}`).css('visibility', 'hidden');
    });
});

// global-style: enable/disable manual size/position change
getActiveTabId().then(activeTabId => {
    chrome.tabs.sendMessage(activeTabId, {
        action: "manualResizeState"
    }, response => {
        if (response) {
            const checkbox = document.getElementById("enable_manual_resize");
            checkbox.checked = response.state;
            checkbox.onchange = (e) => {
                if (e.target.checked) {
                    chrome.tabs.sendMessage(activeTabId, { action: "activatedManualResize" });
                } else {
                    chrome.tabs.sendMessage(activeTabId, { action: "deactivatedManualResize" });
                }
            };
        }
    });
});

// global-style: font-size
getActiveTabId().then(activeTabId => {
    const slider = document.getElementById("global_font_size_slider");

    let sliderChangeHandler = (e) => {
        const newRatio = e.target.value;
        document.getElementById("global_font_size_value").innerText = newRatio;

        for (let index = 1; index <= 3; index++) {
            setSubFontSize(index, document.querySelector(`#font_size_value_${index}`), newRatio);

            // update individual sliders
            document.querySelector(`#font_size_slider_${index}`).value = newRatio;
            document.querySelector(`#font_size_value_${index}`).innerText = newRatio;
        }

    };

    slider.onchange = sliderChangeHandler;
    slider.oninput = sliderChangeHandler;
    slider.disabled = false;

    // if all subtitles has the same size -> set global slider value
    chrome.tabs.sendMessage(activeTabId, {
        action: "isAllSubSameFontSize",
    }, response => {
        if (response && response.isAllSubSameFontSize == true) {
            slider.value = response.fontSize;
            $(slider).trigger("change"); // to trigger sliderChangeHandler
        }
    });
});

// set active tab id and search for video when the popup is opened
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    activeTabId = tabs[0].id;
    searchForVideos();
});

// hide encoding detection info
document.querySelectorAll(".detected_encoding").forEach(elm => elm.style.visibility = "hidden");

// state and register keyboard events for video playback
const regKeyEventsState = document.getElementById("reg_keyboard_event_state");
const regKeyEventsBtn = document.getElementById("reg_keyboard_event");
getActiveTabId().then(activeTabId => {
    regKeyEventsBtn.disabled = true; // enable if video found
    regKeyEventsBtn.onclick = () => {
        chrome.tabs.sendMessage(activeTabId, { action: "regKeyboardEventForVideoPlayback" });
        regKeyEventsBtn.disabled = true;
        regKeyEventsState.innerText = "registered!";
    };
});

// Unload subtitle
document.querySelectorAll(".unload_curr_subtitle").forEach(elm => {
    elm.disabled = true;
    elm.onclick = event => unloadSubtitle(elm.dataset.subtitleIndex);
});

// File input
document.querySelectorAll(".subtitle_file_input").forEach(elm => {
    elm.disabled = true;
    elm.onchange = readFile;
});

// manual encoding checkboxes
let manEncodingCheckboxes = {
    1: document.getElementById("manual_encoding_detection_1"),
    2: document.getElementById("manual_encoding_detection_2"),
    3: document.getElementById("manual_encoding_detection_3")
};

// Body width based on current window width TODO: consider dynamic css instead (media queries [@min-width ...)
// chrome.windows.getCurrent(w => { // w = current window
//     document.querySelector("body").style.width = w.width / 2; // half the size of the window
// });

// Sync listeners
for (let index = 1; index <= 3; index++) {
    const selector = `#subtitle_controls_${index} input[data-sync-amount]`;
    document.querySelectorAll(selector).forEach(elm => {
        elm.onclick = () => seek(parseInt(elm.dataset.syncAmount), index);
        elm.disabled = true;
    });
}

function setUpSyncInfo(index) {
    chrome.tabs.sendMessage(activeTabId, { action: "getSubSeek", index: index }, function (response) {
        if (response != undefined && response.seeked) {
            document.getElementById(`subtitle_seek_${index}`).innerText = response.amount;
        }
    });
}

function searchForVideos() {
    chrome.tabs.sendMessage(activeTabId, { action: "searchForVideos" }, function (response) {
        if (response != undefined && response.videoDetected) { // NOTE: response can be undefined if none of the content scripts (possibly in multiple frames) detected a video -> no response is sent back
            videoKey = response["videoKey"];
            videoFound();
        }
    });
}

function videoFound() {
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
    chrome.tabs.sendMessage(activeTabId, { action: "getRegKeyEventsState" }, function (response) {
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
        const key = getVideoKey(index);
        chrome.storage.local.get(key, function (result) {
            if (result[key]) {
                setCurrSubFileName(JSON.parse(result[key])["fileName"], index);
                enableSyncControls(index);
                enableUnloadSubBtn(index);
                setUpSyncInfo(index);
                document.dispatchEvent(new CustomEvent('sub-activated', { detail: index }));

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

function enableUnloadSubBtn(index) {
    const selector = `.unload_curr_subtitle[data-subtitle-index="${index}"`;
    document.querySelector(selector).disabled = false;
}

function setCurrSubFileName(newName, index) {
    log(`setting subtitle ${index} to: ${newName}`);
    subtitleFileNames[index] = newName;

    const id = `current_subtitle_file_name_${index}`;
    document.getElementById(id).innerText = newName;

    // show detection info from storage if exists
    chrome.storage.local.get(newName, result => {
        if (result !== undefined && result[newName])
            setDetectedEncoding(JSON.parse(result[newName]), index);
    })
}

function readFile() {
    // this === input element
    if (this.files && this.files[0]) {
        const index = this.dataset.subtitleIndex;
        unloadSubtitle(index);
        setCurrSubFileName(this.files[0].name, index);
        enableUnloadSubBtn(index);
        detectEncoding(this, index).then(encoding => {
            log("selected encoding: " + encoding);
            var reader = new FileReader();

            reader.onload = e => {
                // e = ProgressEvent
                // e.target = FileReader
                parseSRT(e.target.result, index);
            };

            reader.readAsText(this.files[0], encoding);
        });
    } else {
        throw new Error("can't read file"); // TODO handle error in user-friendly way
        return false;
    }
    return true;
}

function setDetectedEncoding(detectRes, index) {
    const containerId = `detected_encoding_${index}`;
    if (detectRes === "hide") {
        // hide detection info
        document.getElementById(containerId).style.visibility = "hidden";
        return;
    }
    log(`setting subtitle ${index} file encoding info`);

    document.getElementById(containerId).style.visibility = "visible";

    document.querySelector(`#${containerId} .detected_encoding_charset`).innerText = detectRes["charsetName"];
    document.querySelector(`#${containerId} .detected_encoding_lang`).innerText = detectRes["lang"];
    document.querySelector(`#${containerId} .detected_encoding_confidence`).innerText = Math.round(detectRes["confidence"]) + "%";
}

function saveDetectedEncodingInfoForFile(fileName, encodingInfo) {
    let toSave = {};
    toSave[fileName] = JSON.stringify(encodingInfo);
    chrome.storage.local.set(toSave, () => {
        log(`saved detected file encodings info for: ${fileName}`);
    });
}

function detectEncoding(inputElm, index) {
    if (!inputElm.files || !inputElm.files[0]) return;

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
                setDetectedEncoding(detectRes[0], index);
                saveDetectedEncodingInfoForFile(inputElm.files[0].name, detectRes[0]);

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
    let key = getVideoKey(index);
    toSave[key] = JSON.stringify({
        "fileName": subtitleFileNames[index],
        "subtitles": subtitles
    });
    chrome.storage.local.set(toSave, function () {
        // when done saving
        // send them to content script
        chrome.tabs.sendMessage(activeTabId, { action: "srtParsed", subtitles: subtitles, index: index });
        enableSyncControls(index);
        document.dispatchEvent(new CustomEvent('sub-activated', { detail: index }));
    });
}

function seek(value, index) {
    // log(`request seeking index: ${index}, value: ${value}`);

    // value in ms
    chrome.tabs.sendMessage(activeTabId, { action: "seekSubtitle", index: index, amount: value }, function (response) {
        document.getElementById(`subtitle_seek_${index}`).innerText = response.seekedValue
    });
}

function unloadSubtitle(index) {
    document.dispatchEvent(new CustomEvent('sub-deactivated', { detail: index }));

    // disable unload sub button
    const selector = `button.unload_curr_subtitle[data-subtitle-index="${index}"`;
    document.querySelector(selector).disabled = true;

    // set file name
    setCurrSubFileName("None", index);
    log(`unloading subtitle with index ${index}`);

    // delete from storage
    if (videoKey === null || videoKey === undefined) // double check
        return;
    let key = getVideoKey(index);
    chrome.storage.local.remove(key);

    // hide encoding detection info (TODO: should be also deleted from storage?)
    setDetectedEncoding("hide", index);

    // Send message to active tab to hide subtitle
    chrome.tabs.sendMessage(activeTabId, { action: "unloadSubtitle", index: index });
}

function setSubFontSize(index, span, newRatio) {
    // update span
    span.innerText = newRatio;

    chrome.tabs.sendMessage(activeTabId, {
        action: "changeSubFontSizeRatio",
        newRatio: newRatio,
        index: index
    });
}

function setSubPadding() {
    let index = this.dataset.subtitleIndex;
    let newRatio = this.value;

    // update span
    document.querySelector(`#down_padding_value_${index}`).innerText = newRatio;

    chrome.tabs.sendMessage(activeTabId, {
        action: "setSubPadding",
        newRatio: newRatio,
        index: index
    });
}

function getVideoKey(index) {
    if (videoKey != null)
        if (index)
            return `${videoKey}_${index}`;
        else
            return `${videoKey}`;
    else
        throw new Error("called getVideoKey although no videoKey is set!");
}

/**
 * simple lighten/darken shading
 * https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
 * note: no error checking for invalid parameters
 *
 * @param color hex color ex. "#aabbcc"
 * @param percent float from -1.0 to 1.0
 */
function shadeColor(color, percent) {
    var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent,
        R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

export function loadSubtitle(index, filename, decodedSubtitle) {
    unloadSubtitle(index);
    setCurrSubFileName(filename, index);
    enableUnloadSubBtn(index);
    parseSRT(decodedSubtitle, index);
}