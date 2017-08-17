import React from 'react';
import { CollapsibleComponent } from 'lib/components/CollapsibleComponent';
import { GeneralStyleControls } from './general/GeneralStyleControls';
import { KeyPlayback } from './general/KeyPlayback';

export class GeneralSection extends CollapsibleComponent {
    render() {
        const parentId = "general_section";
        return (
            <section id={parentId}>
                {super.tabIt(GeneralStyleControls, {}, "General Style Controls", "heading_style_controls", "collapse_style_controls", parentId)}
                {super.tabIt(KeyPlayback, {}, "Key Playback", "heading_key_playback", "collapse_key_playback", parentId)}
            </section>
        )
    }
}