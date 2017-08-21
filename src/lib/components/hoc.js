import React, { Component } from 'react'

/**
 * The WrappedComponent must passed a subId as prop
 * it receives a new boolean prop isSubActivated when sub state is changed
 */
export function subscribeToSubtitleEvents(WrappedComponent) {
    return class extends Component {
        constructor(props) {
            super(props)

            this.state = {
                isSubActivated: false
            }

            this.subActivated = this.subActivated.bind(this)
            this.subDeactivated = this.subDeactivated.bind(this)
        }

        componentDidMount() {
            document.addEventListener('sub-activated', this.subActivated)
            document.addEventListener('sub-deactivated', this.subDeactivated)
        }

        subActivated(e) {
            if (e.detail == this.props.subId) {
                this.setState({
                    isSubActivated: true
                })
            }
        }

        subDeactivated(e) {
            if (e.detail == this.props.subId) {
                this.setState({
                    isSubActivated: false
                })
            }
        }

        componentWillUnmount() {
            document.removeEventListener('sub-activated', this.subActivated)
            document.removeEventListener('sub-deactivated', this.subDeactivated)
        }

        render() {
            // injected prop
            const isSubActivated = this.state.isSubActivated;

            return <WrappedComponent isSubActivated={isSubActivated} {...this.props} />
        }
    }
}
