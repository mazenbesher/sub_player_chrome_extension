import React from 'react';
import ReactDOM from 'react-dom';
import { CollapsibleComponent } from 'lib/components/CollapsibleComponent'
import { LoadSubtitleSection } from './subtitle/LoadSubtitleSection'
import { SearchSubtitleSection } from './subtitle/SearchSubtitleSection'
import { SubtitleStyleControls } from './subtitle/SubtitleStyleControls'
import { SubtitleSyncControls } from './subtitle/SubtitleSyncControls'
import { subscribeToSubtitleEvents } from 'lib/components/hoc'

class Subtitle extends CollapsibleComponent {
    constructor(props) {
        super(props);

        this.reactKey = 0;
        // Subscribe component to subtitle events (this.props.isSubActivated)
        this.SubtitleStyleControlsWithSub = subscribeToSubtitleEvents(SubtitleStyleControls)
        // bindings
        this.tabIt = this.tabIt.bind(this);
    }

    tabIt(ReactElm, elmProps, header) {
        const { subId } = this.props;
        const key = this.reactKey++;
        const headingId = `heading_${key}_subtitle_${subId}`;
        const collapseId = `collapse_${key}_subtitle_${subId}`;
        const parentId = `subtitles_tablist_container_${subId}`;

        return super.tabIt(ReactElm, elmProps, header, headingId, collapseId, parentId);
    }

    render() {
        const { subId } = this.props;
        return (
            <div
                id={`subtitle_${subId}`}
                role="tabpane"
                className={"tab-pane" + (subId == 1 ? " active" : "")} >
                <div
                    id={`subtitles_tablist_container_${subId}`}
                    role="tablist">
                    <UnloadSubtitleBtn subId={subId} />
                    {this.tabIt(LoadSubtitleSection, { subId, headerType: 'h6' }, "Open Subtitle")}
                    {this.tabIt(SearchSubtitleSection, { subId }, "Search for subtitles")}
                    {this.tabIt(this.SubtitleStyleControlsWithSub, { subId }, "Style")}
                    {this.tabIt(SubtitleSyncControls, { subId }, "Sync Controls")}
                </div>
            </div>
        )
    }
}

const subtitles = [1, 2, 3].map(num =>
    <Subtitle key={num} subId={num} />
);

export const SubtitlePaneContainer = () => (
    <div id="subtitle_panes_container" className="tab-content">
        {subtitles}
    </div>
)

const UnloadSubtitleBtn = ({ subId }) => (
    <button
        className="btn btn-default unload_curr_subtitle"
        data-subtitle-index={subId}>
        Unload
    </button>
)