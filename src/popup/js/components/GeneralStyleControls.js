import React from 'react';

export class GeneralStyleControls extends React.Component {
    render() {
        return (
            <section>
                <h3>General Style Controls:</h3>
                <input
                    className="btn btn-default"
                    type="checkbox"
                    id="enable_manual_resize"
                    title="Drag a subtitle to change its position or drag a handler to resize it" />
                Enable manual resize and position<br />
                <br />
                Global Font-Size: <span id="global_font_size_value">15</span>
                <input
                    className="font-size-slider"
                    type="range"
                    id="global_font_size_slider"
                    defaultValue="15" min="1" max="30" step="1" />
            </section>
        )
    }
}