"use strict";

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

function youtubeMain() {
    youtubeControlsStateDetector = document.querySelector('#movie_player');

    if (youtubeControlsStateDetector != null) {
        detectControlsState.observe(youtubeControlsStateDetector, classChangeMutationConfig);
    } else {
        console.log("NULL.... shit!")
    }
}
