import React from 'react';
import ReactDOM from 'react-dom';

class SubtitleTab extends React.Component {
    render() {
        const { subId } = this.props;

        return (
            <a
                className={"nav-item nav-link" + (subId == 1 ? " active" : " ")}
                data-toggle="tab"
                href={`#subtitle_${subId}`}
                role="tab"
                aria-controls={`subtitle_${subId}`}
                aria-expanded={subId == 1 ? "true" : ""}>
                Subtitle {subId}
            </a >
        )
    }
}

// first one is active
const listItems = [1, 2, 3].map(num =>
    React.createElement(SubtitleTab, { key: num, subId: num })
);

export class SubtitlesNavTabs extends React.Component {
    render() {
        return (
            <ul
                id="subtitles_nav_tabs"
                className="nav nav-tabs"
                role="tablist">
                {listItems}
            </ul >
        )
    }
}