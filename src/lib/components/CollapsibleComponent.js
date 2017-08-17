import React from 'react';

export class CollapsibleComponent extends React.Component {
    tabIt(ReactElm, elmProps, header, headingId, collapseId, parentId) {
        return (
            <div className="card">
                <div
                    className="card-header"
                    role="tab"
                    id={headingId}>
                    <h5 className="mb-0">
                        <a
                            data-toggle="collapse"
                            href={`#${collapseId}`}
                            aria-expanded="true"
                            aria-controls={collapseId}>
                            {header}
                        </a>
                    </h5>
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
            </div>
        )
    }
}