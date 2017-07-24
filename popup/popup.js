// DOM
const subtitleControls = document.getElementById("subtitle_controls");

const subtitleSeek = document.getElementById("subtitle_seek");
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { seekedSubtitle: true }, function (response) {
        if (response.seeked) {
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
document.getElementById("seekBackMin").onclick = () => seek(-60000);
document.getElementById("seekBackSec").onclick = () => seek(-1000);
document.getElementById("seekForwardSec").onclick = () => seek(1000);
document.getElementById("seekForwardMin").onclick = () => seek(60000);

// Globals
var reader = new FileReader();

function searchForVideos() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { searchForVideos: true }, function (response) {
            if (response.videoDetected) {
                fileInput.disabled = false;
            }
        });
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
    subtitles = [];
    times = [];

    /* 
     * TODO: doesn't work! every time popup clicked it will load newly (Solution: sessionStorage)
     * Search Google: chrome extension save popup state
        // delete unnecessary inputs
        fileInput.remove();
        searchBtn.remove();
    */

    // parse srt
    const timeRegex = /(\d\d):(\d\d):(\d\d),(\d\d\d) --> \d\d:\d\d:\d\d,\d\d\d/g;
    srt = srt.split("\n");

    let text = "";
    var curr = 1;

    for (let i = 0; i < srt.length; i++) {
        line = srt[i].trim();

        // discards number
        if (line.match(/^(\d+)$/g)) {
            continue;
        }

        let match = timeRegex.exec(line);
        if (match) {
            times[curr] = timeToMs(match[1], match[2], match[3], match[4]);
            subtitles[curr - 1] = text;

            text = "";
            curr += 1;
        } else {
            // adding subtitle text
            if (line.length > 0)
                text += line + "\n";
        }
    }

    // send them to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { srtUploaded: true, subtitles: subtitles, times: times });
    });

    // show subtitle controls
    subtitleControls.style.visibility = "visible";
}

function seek(value) {
    subtitleSeek.innerText = parseInt(subtitleSeek.innerText) + value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { seek: value });
    });
}
