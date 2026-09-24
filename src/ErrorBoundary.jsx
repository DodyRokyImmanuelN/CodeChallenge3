import { Component } from 'react'

// Error boundaries must be class components: React has no hook equivalent
// for getDerivedStateFromError / componentDidCatch.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unexpected error in the app:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app" role="alert">
          <h1>Something went wrong.</h1>
          <p className="error-fallback-text">Please reload the page and try again.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
