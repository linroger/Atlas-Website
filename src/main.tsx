import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { IS_STATIC_DEMO } from "@/lib/staticDemo"
import App from './App.tsx'

const Router = IS_STATIC_DEMO ? HashRouter : BrowserRouter
const app = (
  <Router>
    <App />
  </Router>
)
const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    {IS_STATIC_DEMO ? app : <TRPCProvider>{app}</TRPCProvider>}
  </StrictMode>,
)
