import React from 'react';
import ReactDOM from 'react-dom';
import { subscribeToSubtitleEvents } from 'lib/components/hoc';

class SubtitleTab extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { subId, isSubActivated } = this.props;

        return (
            <a
                className={
                    "nav-item nav-link" +
                    (subId == 1 ? " active" : "") +
                    // make subtitle tab head bold if a subtitle is active
                    (isSubActivated ? " active-subtitle" : "")
                }
                data-toggle="tab"
                href={`#subtitle_${subId}`}
                role="tab"
                aria-controls={`subtitle_${subId}`}
                aria-expanded={subId == 1 ? "true" : ""}>
                Subtitle {subId}
                {
                    (isSubActivated) ? (
                        <p className="sub_activated_label">
                            active
                        </p>
                    ) : null
                }

            </a >
        )
    }
}

// first one is active
const listItems = [1, 2, 3].map(num =>
    React.createElement(subscribeToSubtitleEvents(SubtitleTab), { key: num, subId: num })
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