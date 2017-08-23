import React from 'react'
import { sendMessage, shadeColor, colorToHex } from 'lib/utils'
import $ from 'jquery'
import Popper from 'popper.js'

// bootstrap requirements
window.jQuery = $
window.$ = $
window.Popper = Popper
require('bootstrap')
require('bootstrap-colorpicker')

function setTabColor(color, index) {
    const shadedColor = shadeColor(colorToHex(color), .5);
    $(`#subtitles_nav_tabs > a[aria-controls="subtitle_${index}"]`).css("background-color", shadedColor);
    $(`div#subtitle_${index} .card`).css("background-color", shadedColor);
    $(`div#subtitle_${index} .unload_curr_subtitle`).css("background-color", color);
};

export class SubtitleStyleControls extends React.Component {
    state = {
        // Ratio TODO magic numbers must be added to config
        subFontRatio: 15,
        subPaddingRatio: 36
    }

    constructor(props) {
        super(props)

        // get sub font size
        sendMessage({
            action: 'getSubFontSize',
            index: this.props.subId
        }).then(response => {
            if (response && response.newRatio) {
                this.setState({
                    subFontRatio: response.newRatio
                })
            }
        })

        // get padding
        sendMessage({
            action: 'getSubPadding',
            index: this.props.subId
        }).then(response => {
            if (response !== null && response.newRatio) {
                this.setState({
                    subPaddingRatio: response.newRatio
                })
            }
        })
    }

    // must be called only if cp is mounted for first time
    setInitColor = () => {
        const cp = $(this.cp)

        sendMessage({
            action: 'getSubColor',
            index: this.props.subId
        }).then(response => {
            if (response && response.color) {
                this.setTabColor(response.color)
                cp.colorpicker({
                    color: response.color,
                    container: true,
                    inline: true
                })
            }
        })

        // add change color listener (through jQuery API)
        cp.on('changeColor', () => { // == jQuery addEventListener
            const newColor = cp.data('colorpicker').color.toHex()
            this.setTabColor(newColor)

            sendMessage({
                action: "setSubColor",
                color: newColor,
                index: this.props.subId
            })
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.isSubActivated && this.props.isSubActivated) {
            // sub was inactive and is now active!
            this.setInitColor()
        } else if (this.props.isSubActivated) {
            // sub is still active
            // cp color
            sendMessage({
                action: 'getSubColor',
                index: this.props.subId
            }).then(response => {
                if (response && response.color) {
                    const cp = $(this.cp)
                    cp.data('colorpicker').color.setColor(response.color)
                }
            })
        }
    }

    setTabColor = newColor => {
        setTabColor(newColor, this.props.subId)
    }

    sizeSliderChanged = (e) => {
        const newRatio = e.target.value

        this.setState({
            subFontRatio: newRatio
        })

        sendMessage({
            action: 'changeSubFontSizeRatio',
            newRatio,
            index: this.props.subId
        })
    }

    paddingSliderChanged = (e) => {
        const newRatio = e.target.value

        this.setState({
            subPaddingRatio: newRatio
        })

        sendMessage({
            action: "setSubPadding",
            newRatio,
            index: this.props.subId
        })
    }

    render() {
        const { subId, isSubActivated } = this.props;

        return (
            <div
                id={`subtitle_style_controls_${subId}`}
                className="subtitle-style-controls">
                {isSubActivated ? (
                    <div>
                        <div
                            id={`font_size_${subId}`}
                            className="font-size-control">
                            <div>
                                Size ratio:&nbsp;
                                <span id={`font_size_value_${subId}`}>
                                    {this.state.subFontRatio}
                                </span>
                            </div>
                            <div>
                                <input
                                    className="font-size-slider"
                                    type="range"
                                    onInput={e => this.sizeSliderChanged(e)}
                                    onChange={e => this.sizeSliderChanged(e)}
                                    id={`font_size_slider_${subId}`}
                                    value={this.state.subFontRatio}
                                    min={1} max={30} step={1}
                                    data-subtitle-index={`${subId}`} />
                            </div>
                        </div>
                        <div
                            id={`down_padding_${subId}`}
                            className="down-padding-control">
                            <div>
                                Down padding:&nbsp;
                                <span id={`down_padding_value_${subId}`}>
                                    {this.state.subPaddingRatio}
                                </span>
                            </div>
                            <div>
                                <input
                                    className="padding-down-slider"
                                    type="range"
                                    onInput={e => this.paddingSliderChanged(e)}
                                    onChange={e => this.paddingSliderChanged(e)}
                                    value={this.state.subPaddingRatio}
                                    id={`padding_down_slider_${subId}`}
                                    min={1} max={100} step="0.1"
                                    data-subtitle-index={`${subId}`} />
                            </div>
                        </div>
                        <div id={`font_color_${subId}`} className="color-control">
                            <div>
                                Color:
                            </div>
                            <div>
                                <div
                                    id={`font_color_picker_${subId}`}
                                    className="color-picker"
                                    ref={cp => this.cp = cp}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                        <p>
                            This subtitle in not active!
                        </p>
                    )}
            </div>
        )
    }
}