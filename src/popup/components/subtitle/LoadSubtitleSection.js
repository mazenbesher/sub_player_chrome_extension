import React from 'react';
import ReactDOM from 'react-dom';

export const LoadSubtitleSection = ({ subId }) => (
    <div id={`load_subtitle_section_${subId}`}>
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
    </div>
)