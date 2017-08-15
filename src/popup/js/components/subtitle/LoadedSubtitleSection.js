import React from 'react';
import ReactDOM from 'react-dom';

export class LoadedSubtitleSection extends React.Component {
    render() {
        const { subId } = this.props;
        return (
            <div id={`loaded_subtitle_section_${subId}`}>
                <div 
                    className="detected_encoding"
                    id={`detected_encoding_${subId}`}>
                    Detected charset: <span className="detected_encoding_charset"></span><br />
                    Detected language: <span className="detected_encoding_lang"></span><br />
                    Detection confidence: <span className="detected_encoding_confidence"></span>
                </div>
                <button 
                    className="btn btn-default unload_curr_subtitle" 
                    data-subtitle-index={subId}>
                    Unload
                </button>
            </div>
        )
    }
}
