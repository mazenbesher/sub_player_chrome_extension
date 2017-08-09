"use strict";

let netflixControls;

// when done loading
window.addEventListener("load", netflixMain, false);

let netflixControlsObserver = new MutationObserver(function (mutations) {
    const controlsHeight = $(netflixControls).height();
    // console.info(`detect change in class list of netflix subtitle controls`);
    // console.info(`subtitle controls height = ${controlsHeight}`);

    if (controlsHeight > 0) {
        const extraPadding = controlsHeight / 5;
        const newControlsHeight = controlsHeight + extraPadding;
        document.dispatchEvent(new CustomEvent('controls-show', {detail: newControlsHeight}));
    } else {
        // controls height == 0 i.e. are hidden
        document.dispatchEvent(new CustomEvent('controls-hide'));
    }
});

let domChangeObserver = new MutationObserver(mutations => {
    console.log("DOM changed...");

    netflixControls = document.querySelector('.player-controls-wrapper');
    if (netflixControls != null) {
        domChangeObserver.disconnect(); // stop observing DOM for changes

        netflixControlsObserver.observe(netflixControls, {
            attributes: true, attributeFilter: ['class']
        });
    }
});

function netflixMain() {
    domChangeObserver.observe(document, {
        childList: true,
        subtree: true
    });
}
