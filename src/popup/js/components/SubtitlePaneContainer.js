import React from 'react';
import ReactDOM from 'react-dom';
import { LoadSubtitleSection } from './subtitle/LoadSubtitleSection'
import { LoadedSubtitleSection } from './subtitle/LoadedSubtitleSection'
import { ManualFileEncodingSetting } from './subtitle/ManualFileEncodingSetting'
import { SearchSubtitleSection } from './subtitle/SearchSubtitleSection'
import { SubtitleStyleControls } from './subtitle/SubtitleStyleControls'
import { SubtitleSyncControls } from './subtitle/SubtitleSyncControls'


const Subtitle = ({ subId }) => (
    <div
        id={`subtitle_${subId}`}
        role="tabpane"
        className={"tab-pane" + (subId == 1 ? " active" : "")} >
        <LoadSubtitleSection subId={subId} />
        <LoadedSubtitleSection subId={subId} />
        <ManualFileEncodingSetting subId={subId} />
        <SearchSubtitleSection subId={subId} />
        <SubtitleStyleControls subId={subId} />
        <SubtitleSyncControls subId={subId} />
    </div>
)

const subtitles = [1, 2, 3].map(num =>
    <Subtitle key={num} subId={num} />
);

export const SubtitlePaneContainer = () => (
    <div id="subtitle_panes_container" className="tab-content">
        {subtitles}
    </div>
)