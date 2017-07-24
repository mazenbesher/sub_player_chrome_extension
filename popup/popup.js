// DOM
const subtitleControls = document.getElementById("subtitle_controls");

const subtitleSeek = document.getElementById("subtitle_seek");
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { seekedSubtitle: true }, function (response) {
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

// Globals
var reader = new FileReader();
var activeTabId;

// set active tab id
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    activeTabId = tabs[0].id;
});

// TODO check if video already found -> disable search

function searchForVideos() {
    chrome.tabs.sendMessage(activeTabId, { searchForVideos: true }, function (response) {
        if (response != undefined && response.videoDetected) {
            fileInput.disabled = false;
        }
    });
}

function readFile() {
    if (fileInput.files && fileInput.files[0]) {
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
    subtitles = []; // [{start:...ms, end:...ms, subtitle: ...}, ...]

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

    let text = "";
    let curr = -1;
    let last_start;
    let last_end;

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
                text += line + "\n";
        }
    }

    // add last subtitle
    subtitles[curr] = {
        start: last_start,
        end: last_end,
        text: text
    };

    // send them to content script
    chrome.tabs.sendMessage(activeTabId, { srtParsed: true, subtitles: subtitles });

    // show subtitle controls
    // subtitleControls.style.visibility = "visible";
}

function seek(value) {
    chrome.tabs.sendMessage(activeTabId, { seek: value }, function(response){
        subtitleSeek.innerText = response.seekedValue
    });
}
