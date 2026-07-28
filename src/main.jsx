import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { storage } from './utils/storage'

// Load persisted data from native storage BEFORE rendering, so every component
// can read it synchronously on first paint.
storage.init().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
