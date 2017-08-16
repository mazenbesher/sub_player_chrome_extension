import React from 'react';
import request from 'request';
import zlib from 'zlib';
import { sendMessage, osSearch, searchSuggestions } from 'lib/utils';
import { loadSubtitle } from '../../popup'; // TODO make load subtitle global function
import { OS_LANGS } from 'lib/data/os_supported_languages.js';
import * as $ from 'jquery';

export class SearchSubtitleSection extends React.Component {
    constructor(props) {
        super(props);

        this.osLangs = OS_LANGS.map(obj => obj.language);
        this.osIds = OS_LANGS.map(obj => obj.id);

        this.state = {
            tabTitle: "",
            searchTerm: "",
            selectedLangId: "all",
            isSearchingForSubtitle: false,
            isDownloadingSubtitle: false,
            selectedSubtitleOption: null,
            searchResult: [],
            suggestions: []
        };

        // bindings
        this.searchForSubtitle = this.searchForSubtitle.bind(this);
        this.getLangOptions = this.getLangOptions.bind(this);
        this.getActiveTabTitle = this.getActiveTabTitle.bind(this);
        this.downloadSelectedSubtitle = this.downloadSelectedSubtitle.bind(this);
        this.provideSuggestions = this.provideSuggestions.bind(this);
    }

    getActiveTabTitle() {
        sendMessage({ action: "getDocumentTitle" }).then(response => {
            if (response.title) // not empty
                this.setState({ tabTitle: response.title });
        })
    }

    componentDidMount() {
        this.getActiveTabTitle();
    }

    getLangOptions() {
        // populate language options
        const { osLangs, osIds } = this;
        let options = []
        osLangs.map((lang, i) => {
            options.push(
                <option key={i} value={osIds[i]}>
                    {lang}
                </option>
            )
        })

        return options;
    }

    searchForSubtitle() {
        const index = this.props.subId;
        const term = this.state.searchTerm;
        const langId = this.state.selectedLangId;

        this.setState({ isSearchingForSubtitle: true, searchResult: [] });

        let reactKey = 0;
        let currSearchResult = [];
        osSearch(term, langId).then(subtitles => {
            // subtitles is an object with langId as key
            // for sample output see samples folder
            Object.keys(subtitles).forEach(key => {
                if (subtitles[key].length > 0) {
                    // create lang disabled option
                    currSearchResult.push(
                        <option disabled={true} key={reactKey++}>
                            {subtitles[key][0].lang}
                        </option>
                    )

                    for (let subtitle of subtitles[key]) {
                        currSearchResult.push(
                            <option
                                key={reactKey++}
                                title={`Lang: ${subtitle.lang}, Downloads: ${subtitle.downloads}, Score: ${subtitle.score}`}
                                onDoubleClick={this.downloadSelectedSubtitle}
                                data-filename={subtitle.filename}
                                data-url={subtitle.url}
                                data-encoding={subtitle.encoding}
                                data-lang={subtitle.lang}
                                data-langcode={subtitle.langcode}
                                data-id={subtitle.id}
                                data-subtitleIndex={index}
                                disabled={false}
                            >
                                {subtitle.filename}
                            </option>
                        );
                    }
                }
            });

            this.setState({ isSearchingForSubtitle: false, searchResult: currSearchResult });
        }).catch(err => {
            console.error(err);
            this.setState({ isSearchingForSubtitle: false, searchResult: currSearchResult });
        }); // TODO show user-friendly error
    }

    downloadSelectedSubtitle() {
        if (!this.state.selectedSubtitleOption) return;

        const option = this.state.selectedSubtitleOption;
        const filename = option.dataset.filename;
        const url = option.dataset.url;
        const encoding = option.dataset.encoding;
        const lang = option.dataset.lang;
        const langcode = option.dataset.langcode;
        const id = option.dataset.id;
        const index = this.props.subId;

        this.setState({ isDownloadingSubtitle: true });

        // download it
        request({ url, encoding: null }, (error, response, data) => {
            if (error) throw error;

            zlib.unzip(data, (error, arrayBuffer) => {
                if (error) throw error;

                // Text Decoder
                // https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
                // The decode() method takes a DataView as a parameter, which is a wrapper on top of the ArrayBuffer.
                // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
                let dataView = new DataView(arrayBuffer.buffer);
                let decoder = new TextDecoder(encoding);
                let decodedString = decoder.decode(dataView);
                this.setState({ isDownloadingSubtitle: false });
                loadSubtitle(index, filename, decodedString);
            });
        });
    }

    provideSuggestions() {
        const term = this.state.searchTerm;
        const langId = this.state.selectedLangId;

        // empty last suggestions
        this.setState({ suggestions: [] });

        let currSuggestions = [];
        searchSuggestions(term, langId).then(suggestions => {
            suggestions.forEach((suggestion, i) => {
                currSuggestions.push(
                    <option key={i} value={suggestion.name}>
                        {suggestion.year}
                    </option>
                );
            })
            this.setState({ suggestions: currSuggestions });
        }).catch(console.error); // TODO show user-friendly error
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
                    onChange={e => this.setState({
                        searchTerm: e.target.value
                    })}
                    onKeyUp={this.provideSuggestions}
                    disabled={this.state.isSearchingForSubtitle || this.state.isDownloadingSubtitle}
                    placeholder={(tabTitle) ? `ex: ${tabTitle}` : "Search term"}
                    list={`search_suggestions_datalist_${subId}`} />
                <datalist id={`search_suggestions_datalist_${subId}`}>
                    {(this.state.suggestions.length > 0) ? this.state.suggestions : null}
                </datalist>
                <select
                    className="form-control search-langs-select"
                    id={`search_lang_${subId}`}
                    onChange={e => {
                        const selectedIndex = e.target.selectedIndex
                        const selectedOption = e.target.options[selectedIndex];
                        this.setState({ selectedLangId: selectedOption.value });
                    }}
                    disabled={this.state.isSearchingForSubtitle || this.state.isDownloadingSubtitle}
                >
                    {this.getLangOptions()}
                </select>
                <button
                    id={`search_subtitle_btn_${subId}`}
                    className="search-subtitle-btn btn btn-default"
                    onClick={this.searchForSubtitle}
                    data-subtitle-index={`${subId}`}
                    disabled={this.state.isSearchingForSubtitle || this.state.isDownloadingSubtitle}
                >
                    Search
                    </button>
                <div
                    id={`subtitle_loading_${subId}`}
                    className={(this.state.isSearchingForSubtitle) ? "btn" : "btn hide"}>
                    <img
                        src="../assets/svg/loop-circular.svg"
                        id={`subtitle_loading_spinner_${subId}`}
                        className={(this.state.isSearchingForSubtitle) ? "spinning" : ""}
                    />
                    <span id={`subtitle_loading_text_${subId}`}>
                        {(this.state.isSearchingForSubtitle) ? "Searching..." :
                            (this.state.isDownloadingSubtitle) ? "Downloading..." : ""}
                    </span>
                </div>

                <br />
                <span
                    style={(this.state.searchResult.length > 0) ? {} : { display: "none" }} >
                    Hover over any result to see number of downloads and subtitle score
                </span>
                <select
                    id={`search_result_${subId}`}
                    size={(this.state.searchResult.length > 0) ? "10" : "3"}
                    disabled={this.state.searchResult.length <= 0}
                    className="form-control"
                    onChange={e => {
                        const selectedIndex = e.target.selectedIndex
                        const selectedOption = e.target.options[selectedIndex];
                        this.setState({ selectedSubtitleOption: selectedOption });
                    }}
                >
                    {(this.state.searchResult.length > 0) ? this.state.searchResult : ""}
                </select>
                <button
                    id={`load_selected_subtitle_btn_${subId}`}
                    onClick={() => this.downloadSelectedSubtitle}
                    className="select-subtitle-btn btn btn-default"
                    data-subtitle-index={`${subId}`}
                    disabled={this.state.searchResult.length <= 0}
                >
                    Load
                </button>

                <br />
                Subtitles service powered by
                <a target="_blank" href="https://www.opensubtitles.org">www.OpenSubtitles.org</a>
                <img src="../assets/img/opensubtitles_logo.webp" />
            </div>
        )
    }
}