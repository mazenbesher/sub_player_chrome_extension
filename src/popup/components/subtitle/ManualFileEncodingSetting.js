import React from 'react';
import ReactDOM from 'react-dom';

export class ManualFileEncodingSetting extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            manEncodingMode: false
        }

        this.manCheckboxChanged = this.manCheckboxChanged.bind(this);
    }

    manCheckboxChanged(e) {
        const checkboxElm = e.target;
        if (checkboxElm.checked) {
            this.setState({ manEncodingMode: true });
        } else {
            this.setState({ manEncodingMode: false });
        }
    }

    render() {
        const { subId } = this.props;
        return (
            <div
                id={`manual_file_encoding_setting_${subId}`}>
                <div className="form-check form-check-inline">
                    <label htmlFor={`manual_encoding_detection_${subId}`} className="form-check-label">
                        <input
                            type="checkbox"
                            onChange={this.manCheckboxChanged}
                            className="manual_encoding_detection form-check-input"
                            value=""
                            id={`manual_encoding_detection_${subId}`} />
                        I want to set file encoding manually
                    </label>
                </div>
                <br />
                {
                    (this.state.manEncodingMode) ?
                        (
                            <div
                                className="manual_encoding_selection"
                                id={`manual_encoding_selection_${subId}`}>
                                <p>
                                    Please chose an encoding from the list or
                                    type one in the box below and then load
                                    your subtitle in the open subtitle section
                                </p>
                                <select id={`encoding_select_${subId}`}>
                                    <option value="UTF-8">UTF-8 (default)</option>
                                    <option value="CP1251">CP1251</option>
                                    <option value="ANSI">ANSI</option>
                                    <option value="ISO-8859-1">ISO-8859-1</option>
                                    <option value="windows-1252">Windows 1252 (Western Latin)</option>
                                    <option value="windows-1256">Windows 1256 (Arabic)</option>
                                </select>
                                <br />
                                <input
                                    id={`manual_encoding_input_${subId}`}
                                    type="text"
                                    placeholder="or enter it here (ex. windows-1252)" />
                            </div>
                        ) : null
                }
            </div>
        )
    }
}