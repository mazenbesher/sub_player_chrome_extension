import React from 'react';
import ReactDOM from 'react-dom';

export const LoadSubtitleSection = ({ subId }) => (
    <div id={`load_subtitle_section_${subId}`}>
        <h4>Open subtitle</h4>
        <div className="btn btn-default">
            <label
                htmlFor={`subtitle_file_input_${subId}`}
                id={`current_subtitle_file_name_${subId}`}>
                Select file</label>
            <br />
            <input
                type="file"
                className="form-control-file subtitle_file_input"
                id={`subtitle_file_input_${subId}`}
                data-subtitle-index={`${subId}`} />
        </div>
    </div>
)