import React from 'react';
import ReactDOM from 'react-dom';

class SubtitleTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isSubActivated: false
        };
    }

    render() {
        const { subId } = this.props;

        document.addEventListener('sub-activated', e => {
            if (e.detail == this.props.subId)
                this.setState({
                    isSubActivated: true
                })
        })

        document.addEventListener('sub-deactivated', e => {
            if (e.detail == this.props.subId)
                this.setState({
                    isSubActivated: false
                })
        })

        return (
            <a
                className={
                    "nav-item nav-link" +
                    (subId == 1 ? " active" : "") +
                    // make subtitle tab head bold if a subtitle is active
                    (this.state.isSubActivated ? " active-subtitle" : "")
                }
                data-toggle="tab"
                href={`#subtitle_${subId}`}
                role="tab"
                aria-controls={`subtitle_${subId}`}
                aria-expanded={subId == 1 ? "true" : ""}>
                Subtitle {subId}
                {
                    (this.state.isSubActivated) ? (
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