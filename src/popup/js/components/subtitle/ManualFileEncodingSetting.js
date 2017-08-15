import React from 'react';
import ReactDOM from 'react-dom';

export class ManualFileEncodingSetting extends React.Component {
    render() {
        const { subId } = this.props;
        return (
            <div 
                id={`manual_file_encoding_setting_${subId}`}>
                    <input 
                        type="checkbox" 
                        className="manual_encoding_detection" 
                        id={`manual_encoding_detection_${subId}`} />
                    I want to set file encoding manually<br />
                    <div 
                        className="manual_encoding_selection" 
                        id={`manual_encoding_selection_${subId}`}>
                        <select  id={`encoding_select_${subId}`}>
                            <option value="UTF-8">UTF-8 (default)</option>
                            <option value="CP1251">CP1251</option>
                            <option value="ANSI">ANSI</option>
                            <option value="ISO-8859-1">ISO-8859-1</option>
                            <option value="windows-1252">Windows 1252 (Western Latin)</option>
                            <option value="windows-1256">Windows 1256 (Arabic)</option>
                        </select><br />
                        <input 
                            id={`manual_encoding_input_${subId}`} 
                            type="text"
                            placeholder="or enter it here (ex. windows-1252)" />
                    </div>
                </div>
        )
    }
}