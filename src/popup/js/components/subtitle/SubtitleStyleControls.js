import React from 'react';
import ReactDOM from 'react-dom';

export class SubtitleStyleControls extends React.Component {
    render() {
        const { subId } = this.props;

        return (
            <div
                id={`subtitle_style_controls_${subId}`}
                className="subtitle-style-controls">
                <h4>Style</h4>
                <div
                    id={`font_size_${subId}`}
                    className="font-size-control">
                    <div>
                        Size ratio: <span id={`font_size_value_${subId}`}>15</span>
                    </div>
                    <div>
                        <input
                            className="font-size-slider"
                            type="range"
                            id={`font_size_slider_${subId}`}
                            defaultValue={15}
                            min={1} max={30} step={1}
                            data-subtitle-index={`${subId}`} />
                    </div>
                </div>
                <div
                    id={`down_padding_${subId}`}
                    className="down-padding-control">
                    <div>
                        Down padding: <span id={`down_padding_value_${subId}`}>36</span>
                    </div>
                    <div>
                        <input
                            className="padding-down-slider"
                            type="range"
                            id={`padding_down_slider_${subId}`}
                            defaultValue={36} min={1} max={100} step="0.1"
                            data-subtitle-index={`${subId}`} />
                    </div>
                </div>
                <div id={`font_color_${subId}`} className="color-control">
                    <div>
                        Color:
                    </div>
                    <div>
                        <div id={`font_color_picker_${subId}`} className="color-picker" />
                    </div>
                </div>
            </div>
        )
    }
}