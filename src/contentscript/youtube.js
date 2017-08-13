"use strict";

// requires
const $ = require('jquery');

const classChangeMutationConfig = {
    attributes: true, attributeFilter: ['class']
};

let youtubeControlsStateDetector; // <- when its class is changed then controls state is changed

// when done loading
window.addEventListener("load", youtubeMain, false);

// Observers
let detectControlsState = new MutationObserver(mutations => {
    const controlsHeight = $("#movie_player > div.ytp-chrome-bottom").height();
    const extraPadding = controlsHeight / 4;
    const newControlsHeight = controlsHeight + extraPadding;

    mutations.forEach(elm => {
        if (elm.target.classList.contains("ytp-autohide"))
            document.dispatchEvent(new CustomEvent('controls-hide'));
        else
            document.dispatchEvent(new CustomEvent('controls-show', {detail: newControlsHeight}));
    })
});

let domChangeObserver = new MutationObserver(mutations => {
    youtubeControlsStateDetector = document.querySelector('#movie_player');
    if (youtubeControlsStateDetector != null) {
        domChangeObserver.disconnect(); // stop observing DOM for changes
        detectControlsState.observe(youtubeControlsStateDetector, classChangeMutationConfig);
    }
});

function youtubeMain() {
    youtubeControlsStateDetector = document.querySelector('#movie_player');

    if (youtubeControlsStateDetector != null) {
        detectControlsState.observe(youtubeControlsStateDetector, classChangeMutationConfig);
    } else {
        domChangeObserver.observe(document, {
            childList: true,
            subtree: true
        });
    }
}
