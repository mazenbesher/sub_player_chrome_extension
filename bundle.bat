mustache ^
    -p  popup/templates/header.mustache ^
    -p  popup/templates/footer.mustache ^
    -p  popup/templates/subtitle_tabs.mustache ^
    -p  popup/templates/video_search.mustache ^
    -p  popup/templates/key_playback.mustache ^
    -p  popup/templates/general_style_controls.mustache ^
    popup/templates/template_data.json popup/templates/popup.mustache > prod/popup/popup.bundled.html && ^
browserify popup/js/popup.js -o prod/popup/js/popup.bundled.js && ^
browserify background.js -o prod/background.bundled.js
