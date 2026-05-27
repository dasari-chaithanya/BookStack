import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#eaf7fb] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
            <FiAlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-600 max-w-md mb-8">
            An unexpected error occurred in the application. We've logged the issue and are looking into it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-800 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          
          {import.meta.env.DEV && (
            <div className="mt-12 w-full max-w-2xl bg-white p-4 rounded-xl shadow-sm border border-red-100 text-left overflow-auto text-xs text-red-600 font-mono">
              <p className="font-bold mb-2">Developer Info:</p>
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
