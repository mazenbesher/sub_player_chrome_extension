import React from 'react';
import { sendMessage } from 'lib/utils'

function updateSizeSlider(index, newRatio) {
    if(document.querySelector(`#font_size_slider_${index}`)){
        document.querySelector(`#font_size_slider_${index}`).value = newRatio;
        document.querySelector(`#font_size_value_${index}`).innerText = newRatio;
    }
}

export class GeneralStyleControls extends React.Component {
    state = {
        manResizeMode: false,
        allSubtitlesSameSize: false,
        globalFontSize: 15 // must be accessed only if allSubtitlesSameSize is true
    }

    constructor(props) {
        super(props);

        this.manResizeCheckboxChanged = this.manResizeCheckboxChanged.bind(this);
    }

    manResizeCheckboxChanged(e) {
        this.setState({
            manResizeMode: e.target.checked
        })
    }

    sizeSliderChanged = e => {
        let newRatio;
        if (e)
            newRatio = e.target.value
        else
            newRatio = this.state.globalFontSize
        
        this.setState({
            allSubtitlesSameSize: true,
            globalFontSize: newRatio
        })

        for (let index = 1; index <= 3; index++) {
            sendMessage({
                action: 'changeSubFontSizeRatio',
                newRatio, index
            })
            
            updateSizeSlider(index, newRatio)
        }
    }

    componentDidMount() {
        // global font size
        sendMessage({
            action: "isAllSubSameFontSize",
        }).then(response => {
            if (response && response.isAllSubSameFontSize == true) {
                this.setState({
                    allSubtitlesSameSize: true,
                    globalFontSize: response.fontSize
                })
                this.sizeSliderChanged()
            }
        })

        // man size mode
        sendMessage({
            action: 'manualResizeState'
        }).then(response => {
            if(response && response.state){
                this.setState({
                    manResizeMode: response.state
                })
            }
        })
    }

    render() {
        const { manResizeMode, allSubtitlesSameSize, globalFontSize } = this.state

        return (
            <section>
                Global Font-Size:&nbsp;
                <span id="global_font_size_value">
                    {allSubtitlesSameSize ? globalFontSize : "Not set"}
                </span>
                <input
                    className="font-size-slider"
                    type="range"
                    onInput={e => this.sizeSliderChanged(e)}
                    onChange={e => this.sizeSliderChanged(e)}
                    id="global_font_size_slider"
                    defaultValue="15"
                    min="1" max="30" step="1" />

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