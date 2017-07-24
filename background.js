// chrome.tabs.onUpdated.addListener(tabUpdated);
// chrome.runtime.onMessage.addListener(messageRequestListener);

// function tabUpdated(tabId, changeInfo, tab) {
//     if (tab.status === "complete" && tab.active)
//         chrome.tabs.connect(tabId);
// }

// function messageRequestListener(request, sender, sendResponse) {
//     console.log("message received");
//     console.log(request);
//     console.log(sender);
//     console.log(sendResponse);

//     if (request.videoDetected) {

//     }
// }

// chrome.runtime.onStartup.addListener(function () {
//     chrome.storage.local.clear()
// })