import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ArchivePage } from './pages/ArchivePage.tsx'

const isArchiveRoute = window.location.pathname === '/archive'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isArchiveRoute ? <ArchivePage /> : <App />}</StrictMode>,
)
