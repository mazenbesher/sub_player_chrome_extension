import React from 'react';
import ReactDOM from 'react-dom';

export class EncodingInfoSection extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { subId } = this.props;
        return (
            <div id={`loaded_subtitle_section_${subId}`}>
                <p>
                    Here you can see the detected encoding info of any locally loaded subtitle.
                </p>
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
                            <td><span className="detected_encoding_charset"></span></td>
                            <td><span className="detected_encoding_lang"></span></td>
                            <td><span className="detected_encoding_confidence"></span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}
