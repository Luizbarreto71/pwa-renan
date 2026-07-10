'use client'

import { useEffect } from 'react'

// Registra o service worker (/sw.js) no client apenas quando o ambiente é
// seguro e o app estiver pronto para servir a PWA. Em desenvolvimento,
// o registro é omitido para evitar ruído de console e falhas de runtime.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost'
    if (!isSecureContext) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (error) {
        console.warn('[PWA] Service worker registration skipped:', error)
      }
    }

    if (document.readyState === 'complete') {
      void register()
    } else {
      const onLoad = () => {
        void register()
      }

      window.addEventListener('load', onLoad, { once: true })
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  return null
}
