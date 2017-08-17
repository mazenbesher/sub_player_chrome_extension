import React from 'react';

export class KeyPlayback extends React.Component {
    render() {
        return (
            <section>
                <h3>Key Playback:</h3>
                <p>Register keyboard events to control video</p>
                <button className="btn btn-default" id="reg_keyboard_event">Register</button>
                <span>State: <span id="reg_keyboard_event_state">not registered</span></span>
                <br />
                <table>
                    <tbody>
                        <tr>
                            <th>Right Arrow</th>
                            <th>Seek +5 Sec</th>
                        </tr>
                        <tr>
                            <td>Left Arrow</td>
                            <td>Seek -5 Sec</td>
                        </tr>
                        <tr>
                            <td>Ctrl + Right Arrow</td>
                            <td>Seek +1 Min</td>
                        </tr>
                        <tr>
                            <td>Ctrl + Left Arrow</td>
                            <td>Seek -1 Min</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        )
    }
}