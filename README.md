Add subtitle overlay from SRT files to any video element, with options to sync the subtitle.

# Features to add
- [ ] resize subtitle if width > video width
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
- [ ] hide sync controls if no subtitle is active (found video + uploaded srt)
- [ ] options page for some subtitle controls (such as style, subtitle databases, ...)
- [ ] subtitle controls on video itself (instead in popup)
- [ ] other languages (unicode) support
- [ ] raise subtitle if video controls are visible
- [x] save subtitle when open page again, so no need to reload the subtitle (using `chrome.storage`)
    - [ ] save sync value and reapply it
- [ ] option to manage (show/update/remove) all saved subtitles
- [x] keyboard to control video playback
    - [ ] add options for customizable keys such as modifiers
    - [ ] option to always register on this page (save in `chrome.storage.local`)
    - [ ] better way to show seek amount (right now in subtitle!)
- [x] auto detect file encoding (using [charset-detector](https://www.npmjs.com/package/charset-detector) and `browserify`)

## Extend subtitle controls
- [ ] reset subtitle sync
- [ ] sync range input
- [ ] change file
- [ ] disable
- [ ] style control (maybe in `css`)

## Learn mode
- [ ] multiple languages at the same time

# Bugs
- [ ] can't override video in `webkit-fullscreen` mode -> can't show subtitle container/holder divs
