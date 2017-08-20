import React from 'react';
import PropTypes from 'prop-types';

export class CollapsibleComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    tabIt(ReactElm, elmProps, header, headingId, collapseId, parentId) {
        const { headerType } = this.props;
        return (
            <div className="card">
                <div
                    className="card-header"
                    role="tab"
                    id={headingId}>
                    {React.createElement(headerType,{},
                        <a
                            data-toggle="collapse"
                            href={`#${collapseId}`}
                            aria-expanded="true"
                                aria-controls={collapseId}>
                            {header}
                        </a>
                    )}
            </div>

                <div
                    id={collapseId}
                    className="collapse"
                    role="tabpanel"
                    aria-labelledby={headingId}
                    data-parent={`#${parentId}`}>
                    <div className="card-body">
                        {React.createElement(ReactElm, elmProps)}
                    </div>
                </div>
            </div >
        )
    }
}

// default props
CollapsibleComponent.defaultProps = {
    headerType: 'h5'
}

// proptypes
CollapsibleComponent.propTypes = {
    headerType: PropTypes.string
}
