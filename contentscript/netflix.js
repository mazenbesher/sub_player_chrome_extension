var netflixControls;

let netflixControlsObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        const controlsHeight = $(netflixControls).height();
        // console.info(`detect change in class list of netflix subtitle controls`);
        // console.info(`subtitle controls height = ${controlsHeight}`);
        if (controlsHeight > 0) {
            for (let index = 1; index <= 3; index++) {
                if (isSubtitleActive(index)) {
                    const originalPadding = videoElm.clientHeight / subPadHeightRatios[index];
                    const extraPadding = controlsHeight / 5;
                    const newPadding = originalPadding + extraPadding + controlsHeight;
                    $(subtitleHolders[index]).css('padding-bottom', `${newPadding}px`);
                }
            }
        } else {
            // controls height == 0 i.e. are hidden
            for (let index = 1; index <= 3; index++) {
                if (isSubtitleActive(index)) {
                    const originalPadding = videoElm.clientHeight / subPadHeightRatios[index];
                    $(subtitleHolders[index]).css('padding-bottom', `${originalPadding}px`);
                }
            }
        }
    })
});

let domChangeObserver = new MutationObserver(mutations => {
    console.log("DOM changed...");
    mutations.forEach(mutation => {
        netflixControls = document.querySelector('.player-controls-wrapper');
        if (netflixControls != null) {
            domChangeObserver.disconnect(); // stop observing DOM for changes
            pushSubtitleObserver();
        }
    })
});

function main() {
    domChangeObserver.observe(document, {
        childList: true,
        subtree: true
    });
}

function pushSubtitleObserver() {
    netflixControlsObserver.observe(netflixControls, {
        attributes: true, attributeFilter: ['class']
    });
}

// when done loading
window.addEventListener("load", main, false);