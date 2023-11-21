import React, { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'

startTransition(() => {
  setTimeout(() => {
    hydrateRoot(document.getElementById('root'),<App comments={window.__diy_ssr_context} />)
  }, 10000)
})