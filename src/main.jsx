import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FastKeno from '../FastKeno.jsx'

// Toggle this flag to switch between the FastKeno demo and the main App.
// Set to true to render FastKeno, false to render App.
const USE_FASTKENO = false

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {USE_FASTKENO ? <FastKeno /> : <App />}
  </StrictMode>,
)