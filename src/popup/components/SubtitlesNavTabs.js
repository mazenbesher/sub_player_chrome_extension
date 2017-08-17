import React from 'react';
import ReactDOM from 'react-dom';

// first one is active
const listItems = [1, 2, 3].map(num =>
    <a
        key={num}
        className={"nav-item nav-link" + (num == 1 ? " active" : "")}
        data-toggle="tab"
        href={`#subtitle_${num}`}
        role="tab"
        aria-controls={`subtitle_${num}`}
        aria-expanded={num == 1 ? "true" : ""}>
        Subtitle {num}
    </a >
);

export const SubtitlesNavTabs = () => (
    <ul
        id="subtitles_nav_tabs"
        className="nav nav-tabs"
        role="tablist">
        {listItems}
    </ul >
)