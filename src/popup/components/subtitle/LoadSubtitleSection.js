import React from 'react';
import ReactDOM from 'react-dom';
import { EncodingInfoSection } from './load_section/EncodingInfoSection'
import { ManualFileEncodingSetting } from './load_section/ManualFileEncodingSetting'
import { CollapsibleComponent } from 'lib/components/CollapsibleComponent'

export class LoadSubtitleSection extends CollapsibleComponent {
    constructor(props) {
        super(props);

        this.reactKey = 0;
        this.containerId = `load_subtitle_section_${this.props.subId}`;
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
                        className="form-control-file subtitle_file_input btn btn-default"
                        id={`subtitle_file_input_${subId}`}
                        data-subtitle-index={`${subId}`} />
                </div>
                {this.tabIt(EncodingInfoSection, { subId }, "Subtitle Encoding Info", 
                    `encoding_subtitle_${subId}_heading_${this.reactKey++}`,
                    `encoding_subtitle_${subId}_collapse_${this.reactKey++}`, this.containerId)}
                {this.tabIt(ManualFileEncodingSetting, { subId }, "Manual File Encoding", 
                    `man_encoding_subtitle_${subId}_heading_${this.reactKey++}`,
                    `man_encoding_subtitle_${subId}_collapse_${this.reactKey++}`, this.containerId)}
            </div>
        )
    }
}
