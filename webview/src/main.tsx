import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// VS Code APIの型定義
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)