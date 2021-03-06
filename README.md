Add subtitle overlay from SRT files to any video element, with options to sync the subtitle.

# Note:
1. To install dependencies run `npm install`    
All files with `*.bundled.*` extension are generated dynamically by running `npm run build` and they are not included in the repo.    

2. A `symlink` in `node_modules\lib` pointing to `src\lib` is required for `imports` in `.js` files (generated under windows, i.e. it may not work on your system)

# TODOs:
- [ ] add linting scripts
- [ ] global log to log errors (`window.onerror`)
    - [x] global log in main scripts (`contentscript` and `popup`)
    - [ ] global log in components
- [x] redirect all log messages to bg page
- [x] add indicator while searching or downloading a subtitle
- [x] add `watch` mode in `npm`
- [ ] show limit for downloading subtitles from OpenSubtitles.org
- [ ] use `setUninstallURL` to clear storage
- [ ] use `chrome.runtime.getBackgroundPage` instead of messaging
- [x] auto suggest file name from page info (done: page title as placeholder)
- [ ] add error reporting mechanism (maybe [StackTraceJS](https://www.stacktracejs.com/) or [jsErrLog](http://jserrlog.appspot.com/)) 
- [ ] consider using `TextDecorder` instead of `FileReader` for local file upload
- [ ] resize subtitles with mouse
- [x] reposition subtitles with mouse
- [x] use other key for subtitles saving since all youtube videos have the same video source! (fixed: now using `location.href` + `video.currentSrc`) 
- [x] stop searching if other script on the same page has already found a video (done using communication with bg) 
- [ ] show some indicator when changing size even if no current subtitle is visible  
- [ ] unintuitive size controls
- [ ] use `MutationObserver` to detect video instead of an interval (not working)
    - [ ] check if it can detect changes in `iframes` and in that case give `all_frames` manifest option
    - [ ] no need for site specific scripts but specific selectors
- [ ] push subtitle up if video controls are visible (site specific)
    - [x] youtube
    - [x] netflix
    - [x] general (default controls)
    - [ ] smooth controls movement when pushed
- [x] style subtitle container to match video style (using [`MutationObserver`](https://developer.mozilla.org/en/docs/Web/API/MutationObserver#MutationObserverInit))
- [ ] disable color picker if no subtitle is activated (add as an event listener for `sub-deactivated`)
- [ ] random number of subtitles (right now fixed to three)
- [ ] add option to unload all subtitles
- [x] use template for subtitle panes in html (b/s they are almost the same but some `id`s and `data-subtitle-index` are different), solved using `mustache`
- [ ] consider using `webpack`
- [ ] show if subtitle is loaded on the video (specially if from cache and maybe give the option to unload it)
- [x] resize subtitle if width > video width (fixed by setting `subtitleContainer` width to match `video`)
- [ ] save playing position before close (use `chrome.tabs.onRemoved.addListener`)
- [ ] customize `eslint` options
- [x] change size and position when video resizes
- [x] delete old loaded subtitle when choosing new one
- [x] subtitle size relative to video size
- [x] if a subtitle is uploaded disable up `choose file` button
- [x] remove current subtitle and enable `choose file` button
- [ ] drag and drop to add subtitle file (maybe replace old one)
- [ ] spinner while searching for a video and show results (even if not found)
    - Note: this requires knowing how many frames (i.e. content scripts) there are in the current active tab and the fact that all of them couldn't detect any video in their corresponding document element
- [ ] auto search for subtitles
- [ ] disable search for video if one found
- [x] hide sync controls if no subtitle is active (found video + uploaded srt) Solution: disabled if no subtitle is active
- [ ] options page for some subtitle controls (such as style, subtitle databases, ...)
- [ ] subtitle controls on video itself (instead in popup)
- [ ] other languages (unicode) support
- [ ] raise subtitle if video controls are visible
- [x] save subtitle when open page again, so no need to reload the subtitle (using `chrome.storage`)
    - [ ] save sync value and reapply it
    - [x] save detected file encodings info and show them on start
- [ ] option to manage (show/update/remove) all saved subtitles
- [x] keyboard to control video playback
    - [ ] add options for customizable keys such as modifiers
    - [ ] option to always register on this page (save in `chrome.storage.local`)
    - [ ] better way to show seeked amount after pressing a key (right now in subtitle!, see youtube style with arrows)
- [x] auto detect file encoding (using [charset-detector](https://www.npmjs.com/package/charset-detector) and `browserify`)

## Performance:
- [ ] add subtitle containers only when needed (right now the 3 of them are added always when a `video` is found)

## Extend subtitle controls
- [ ] reset subtitle sync
- [ ] sync range input
- [x] change file
- [ ] disable
- [ ] style control (maybe in `css`)
    - [x] font size
    - [x] font color
- [ ] global style controls
    - [x] font size
    - [x] allow reposition with mouse 

## Learn mode
- [x] multiple languages at the same time
- [ ] adjust subtitle width according to the number of enabled subtitles

# Bugs
- [ ] if subtitle file input is disabled then label must also be disabled
- [ ] can't override video in `webkit-fullscreen` mode -> can't show subtitle container/holder divs
