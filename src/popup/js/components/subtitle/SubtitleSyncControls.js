import React from 'react';
import ReactDOM from 'react-dom';

export class SubtitleSyncControls extends React.Component {
    render() {
        const { subId } = this.props;

        return (

            <div id={`subtitle_sync_controls_${subId}`}>
                <h4>Sync Controls:</h4>
                <div id={`subtitle_controls_${subId}`}>
                    <input 
                        className="btn btn-default" type="button" 
                        data-sync-amount={-1000} 
                        title="seek back one second" defaultValue="<<" />
                    <input 
                        className="btn btn-default" type="button" 
                        data-sync-amount={-500} 
                        title="seek back half a second" defaultValue="<" />
                    <input 
                        className="btn btn-default" type="button" 
                        data-sync-amount={500} 
                        title="seek forward half a second" defaultValue=">" />
                    <input 
                        className="btn btn-default" type="button" 
                        data-sync-amount={1000} 
                        title="seek forward one second" defaultValue=">>" />
                </div>
                <p><span id={`subtitle_seek_${subId}`}>0</span> ms</p>
            </div>
        );
    }
}