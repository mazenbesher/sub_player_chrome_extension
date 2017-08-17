import React from 'react';
import ReactDOM from 'react-dom';
import { CollapsibleComponent } from 'lib/components/CollapsibleComponent'
import { LoadSubtitleSection } from './subtitle/LoadSubtitleSection'
import { EncodingInfoSection } from './subtitle/EncodingInfoSection'
import { ManualFileEncodingSetting } from './subtitle/ManualFileEncodingSetting'
import { SearchSubtitleSection } from './subtitle/SearchSubtitleSection'
import { SubtitleStyleControls } from './subtitle/SubtitleStyleControls'
import { SubtitleSyncControls } from './subtitle/SubtitleSyncControls'

class Subtitle extends CollapsibleComponent {
    constructor(props) {
        super(props);

        this.reactKey = 0;

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
                    {this.tabIt(LoadSubtitleSection, { subId }, "Open Subtitle")}
                    {this.tabIt(EncodingInfoSection, { subId }, "Subtitle Encoding Info")}
                    {this.tabIt(ManualFileEncodingSetting, { subId }, "Manual File Encoding")}
                    {this.tabIt(SearchSubtitleSection, { subId }, "Search for subtitles")}
                    {this.tabIt(SubtitleStyleControls, { subId }, "Style")}
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