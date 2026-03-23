'use client'

import { useEffect } from 'react'

export default function AgendaRedirect() {
  useEffect(() => {
    window.location.replace('/dashboard')
  }, [])
  return null
}
