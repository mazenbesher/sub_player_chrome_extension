import React from 'react';

export class GeneralStyleControls extends React.Component {
    constructor(props) {
        super(props);

        this.manResizeCheckboxChanged = this.manResizeCheckboxChanged.bind(this);

        this.state = {
            manResizeMode: false
        }
    }

    manResizeCheckboxChanged(e) {
        this.setState({
            manResizeMode: e.target.checked
        })
    }

    render() {
        return (
            <section>
                Global Font-Size: <span id="global_font_size_value">15</span>
                <input
                    className="font-size-slider"
                    type="range"
                    id="global_font_size_slider"
                    defaultValue="15" min="1" max="30" step="1" />

                <div id="enable_resize_option">
                    <label htmlFor="enable_manual_resize">
                        <input
                            className="btn btn-default"
                            type="checkbox"
                            onChange={this.manResizeCheckboxChanged}
                            id="enable_manual_resize" />
                        <span className="checkbox-label">
                            Enable manual resize and position
                        </span>
                    </label>
                    {
                        (this.state.manResizeMode) ? (
                            <p>
                                Pause the video to see the handlers and enable repositioning.
                                Drag a subtitle to change its position or drag its handler to resize it
                            </p>
                        ) : null
                    }
                </div>
            </section>
        )
    }
}