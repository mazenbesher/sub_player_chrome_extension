import React from 'react';
import { sendMessage, osSearch, searchSuggestions, downloadSubtitle } from 'lib/utils';
import { loadSubtitle } from '../../popup'; // TODO make load subtitle global function
import { OS_LANGS } from 'lib/data/os_supported_languages.js';
import * as $ from 'jquery';

const netState = {
    downloading: "Downloading...",
    searching: "Searching...",
    none: ""
}

const infoState = {
    toDownload: `Hover over any result to see number of downloads and subtitle score.
            To download any subtitle double click on it.`,
    downloaded: "Subtitle downloaded",
    error: "Service unavailable please try again later.",
    none: ""
}

export class SearchSubtitleSection extends React.Component {
    constructor(props) {
        super(props);

        this.osLangs = OS_LANGS.map(obj => obj.language);
        this.osIds = OS_LANGS.map(obj => obj.id);

        this.state = {
            tabTitle: "",
            searchTerm: "",
            selectedLangId: "all",
            netState: netState.none,
            infoState: infoState.none,
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

        this.setState({
            netState: netState.searching,
            infoState: infoState.none,
            searchResult: [],
        });

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

            this.setState({
                netState: netState.none,
                infoState: infoState.toDownload,
                searchResult: currSearchResult
            });
        }).catch(err => {
            console.error(err);
            this.setState({
                netState: netState.none,
                infoState: infoState.error,
                searchResult: currSearchResult,
            });
        }); // TODO show user-friendly error
    }

    downloadSelectedSubtitle() {
        if (!this.state.selectedSubtitleOption) return;

        const index = this.props.subId;
        const option = this.state.selectedSubtitleOption;

        const filename = option.dataset.filename;
        const url = option.dataset.url;
        const encoding = option.dataset.encoding;
        // const lang = option.dataset.lang;
        // const langcode = option.dataset.langcode;
        // const id = option.dataset.id;

        this.setState({
            netState: netState.downloading,
            infoState: infoState.none
        });

        // download it
        downloadSubtitle(url, encoding).then(decodedSubtitle => {
            this.setState({
                netState: netState.none,
                infoState: infoState.downloaded
            });
            loadSubtitle(index, filename, decodedSubtitle);
        }).catch(err => {
            this.setState({
                netState: netState.none,
                infoState: infoState.error
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
                <input
                    type="text"
                    className="form-control search_term_input"
                    data-subtitle-index={`${subId}`}
                    id={`search_term_${subId}`}
                    onChange={e => this.setState({
                        searchTerm: e.target.value
                    })}
                    onKeyUp={this.provideSuggestions}
                    disabled={this.state.netState != netState.none} // i.e. there is an activity on the net and we don't want to allow interaction with input elements
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
                    disabled={this.state.netState != netState.none}
                >
                    {this.getLangOptions()}
                </select>
                <button
                    id={`search_subtitle_btn_${subId}`}
                    className="search-subtitle-btn btn btn-success"
                    onClick={this.searchForSubtitle}
                    data-subtitle-index={`${subId}`}
                    disabled={this.state.netState != netState.none}
                >
                    Search
                    </button>
                <div
                    id={`subtitle_loading_${subId}`}
                    className={(this.state.netState != netState.none) ? "btn" : "btn hide"}>
                    <img
                        src="../assets/svg/loop-circular.svg"
                        id={`subtitle_loading_spinner_${subId}`}
                        className={(this.state.netState != netState.none) ? "spinning" : ""}
                    />
                    <span id={`subtitle_loading_text_${subId}`}>
                        {this.state.netState}
                    </span>
                </div>

                <br />

                <p id="subtitle_info" >
                    {this.state.infoState}
                </p>
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
                    onClick={this.downloadSelectedSubtitle}
                    className="load-subtitle-btn btn btn-primary"
                    data-subtitle-index={`${subId}`}
                    disabled={this.state.searchResult.length <= 0 || !this.state.selectedSubtitleOption}
                >
                    Load
                </button>

                <br />
                <p>
                    Subtitles service powered by: <a target="_blank" href="https://www.opensubtitles.org">www.OpenSubtitles.org</a>
                </p>
                <img
                    style={{
                        display: "block",
                        margin: "auto"
                    }}
                    src="../assets/img/opensubtitles_logo.webp" />
            </div>
        )
    }
}