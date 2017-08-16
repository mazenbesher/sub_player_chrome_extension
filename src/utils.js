// promise for getting active tab id
export const getActiveTabId = () => new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve(tabs[0].id);
    });
});

// send message