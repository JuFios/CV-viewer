import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-600"
          >
            <p>Щось пішло не так під час відображення.</p>
            <button
              type="button"
              className="rounded-md bg-neutral-800 px-3 py-1.5 text-white hover:bg-neutral-700"
              onClick={() => this.setState({ error: null })}
            >
              Спробувати ще раз
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
