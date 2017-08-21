import React from 'react';
import ReactDOM from 'react-dom';
import { EncodingInfoSection } from './load_section/EncodingInfoSection'
import { ManualFileEncodingSetting } from './load_section/ManualFileEncodingSetting'
import { CollapsibleComponent } from 'lib/components/CollapsibleComponent'
import { subscribeToSubtitleEvents } from 'lib/components/hoc'

export class LoadSubtitleSection extends CollapsibleComponent {
    constructor(props) {
        super(props);

        const { subId } = this.props;

        this.reactKey = 0;
        this.containerId = `load_subtitle_section_${subId}`;

        this.TabbedEncodingInfoWithSub = super.tabIt(
            subscribeToSubtitleEvents(EncodingInfoSection),
            { subId },
            "Subtitle Encoding Info",
            `encoding_subtitle_${subId}_heading_${this.reactKey++}`,
            `encoding_subtitle_${subId}_collapse_${this.reactKey++}`, this.containerId)
    }

    render() {
        const { subId } = this.props;
        return (
            <div id={this.containerId}>
                <div>
                    <h6>Current subtitle filename: </h6>
                    <p>
                        <label
                            htmlFor={`subtitle_file_input_${subId}`}
                            id={`current_subtitle_file_name_${subId}`}>
                            No file chosen
                    </label>
                    </p>
                    <input
                        type="file"
                        accept=".srt"
                        className="form-control-file subtitle_file_input btn btn-default"
                        id={`subtitle_file_input_${subId}`}
                        data-subtitle-index={`${subId}`} />
                </div>
                {this.TabbedEncodingInfoWithSub}
                {
                    this.tabIt(ManualFileEncodingSetting, { subId }, "Manual File Encoding",
                        `man_encoding_subtitle_${subId}_heading_${this.reactKey++}`,
                        `man_encoding_subtitle_${subId}_collapse_${this.reactKey++}`, this.containerId)
                }
            </div>
        )
    }
}
