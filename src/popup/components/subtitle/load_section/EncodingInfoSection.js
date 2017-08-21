import React from 'react';
import ReactDOM from 'react-dom';

export class EncodingInfoSection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            encodingInfo: null
        }
    }

    componentDidMount() {
        document.addEventListener('set-detected-encoding-info', e => this.setState({
            encodingInfo: e.detail
        }))
    }

    componentWillUnmount() {
        document.removeEventListener('set-detected-encoding-info', e => this.setState({
            encodingInfo: e.detail
        }))
    }


    render() {
        // isSubActivated because of subscription to subtitle events (see lib/components/hoc -> subscribeToSubtitleEvents)
        const { subId, isSubActivated } = this.props;

        return (
            <div id={`loaded_subtitle_section_${subId}`}>
                {isSubActivated && this.state.encodingInfo ? (
                    <table
                        className="detected_encoding table table-sm"
                        id={`detected_encoding_${subId}`}>
                        <thead>
                            <tr>
                                <th>Detected charset</th>
                                <th>Detected language</th>
                                <th>Detection confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr scope="row">
                                <td><span className="detected_encoding_charset">{this.state.encodingInfo.charsetName}</span></td>
                                <td><span className="detected_encoding_lang">{this.state.encodingInfo.lang}</span></td>
                                <td>
                                    <span className="detected_encoding_confidence">{
                                        Math.round(this.state.encodingInfo.confidence) + "%"
                                    }
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                        <p>
                            Here you can see the detected encoding info of any locally loaded subtitle.
                        </p>
                    )}
            </div>
        )
    }
}
