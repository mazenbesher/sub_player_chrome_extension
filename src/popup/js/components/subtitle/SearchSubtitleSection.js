import React from 'react';
import ReactDOM from 'react-dom';
import { sendMessage } from '../../../../utils';




export class SearchSubtitleSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tabTitle: "" };
    }

    getActiveTabTitle() {
        sendMessage({action: "getDocumentTitle"}).then(response => {
                if (response.title) // not empty
                    this.setState({ tabTitle: response.title });
        })
    }

    componentDidMount() {
        this.getActiveTabTitle();
    }

    render() {
        const { subId } = this.props;
        const { tabTitle } = this.state;

        return (
            <div
                id={`search_subtitle_section_${subId}`}
                className="search-subtitle-section">
                <h4>Search for subtitles</h4>
                <input
                    type="text"
                    className="form-control search_term_input"
                    data-subtitle-index={`${subId}`}
                    id={`search_term_${subId}`}
                    placeholder={(tabTitle) ? `ex: ${tabTitle}` : "Search term"}
                    list={`search_suggestions_datalist_${subId}`} />
                <datalist id={`search_suggestions_datalist_${subId}`}></datalist>
                <select
                    className="form-control search-langs-select"
                    id={`search_lang_${subId}`}></select>
                <button
                    id={`search_subtitle_btn_${subId}`}
                    className="search-subtitle-btn btn btn-default"
                    data-subtitle-index={`${subId}`}>Search
                    </button>
                <div
                    id={`subtitle_loading_${subId}`}
                    className="btn hide">
                    <img
                        src="../assets/svg/loop-circular.svg"
                        id={`subtitle_loading_spinner_${subId}`} />
                    <span id={`subtitle_loading_text_${subId}`}></span>
                </div>


                <br />
                <select
                    id={`search_result_${subId}`}
                    size="0"
                    multiple="no"
                    disabled className="form-control"></select>
                <button
                    id={`load_selected_subtitle_btn_${subId}`}
                    className="select-subtitle-btn btn btn-default"
                    data-subtitle-index={`${subId}`} disabled>Load
                    </button>

                <br />
                Subtitles service powered by
                    <a target="_blank" href="https://www.opensubtitles.org">www.OpenSubtitles.org</a>
                <img src="../assets/img/opensubtitles_logo.webp" />
            </div>
        )
    }
}