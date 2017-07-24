Add subtitle overlay from SRT files to any video element, with options to seek the subtitle.

# Features to add
- [x] change size and position when video resizes
- [ ] subtitle size relative to video size
- [ ] if a subtitle is uploaded disable up `choose file` button
- [ ] remove current subtitle and enable `choose file` button
- [ ] drag and drop to add subtitle file (maybe replace old one)
- [ ] spinner while searching for a video and show results (even if not found)
    - Note: this requires knowing how many frames (i.e. content scripts) there are in the current active tab and the fact that all of them couldn't detect any video in their corresponding document element
- [ ] auto search for subtitles
- [ ] disable search for video if one found
- [ ] hide sync controls if no subtitle is active (found video + uploaded srt)
- [ ] options page for some subtitle controls (such as style, subtitle databases, ...)
- [ ] subtitle controls on video itself (instead in popup)
- [ ] other languages (unicode) support

## [ ] extend subtitle controls
- [ ] reset subtitle sync
- [ ] sync range input
- [ ] change file
- [ ] disable
- [ ] style control (maybe in `css`)

## [ ] Learn mode
- [ ] multiple languages at the same time
