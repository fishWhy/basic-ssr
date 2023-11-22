import React, { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'

const clientPromise = new Promise((resolve) => {
  window.__setComments_data = (comments) => resolve(comments)
})

startTransition(() => {
  setTimeout(
    () => {
      hydrateRoot(document.getElementById('root'), <App comments={clientPromise} />)
    },
    5000
  );
})