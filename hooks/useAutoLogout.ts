'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const AUTO_LOGOUT_TIME = 5 * 60 * 1000 // 5 minutes

export default function useAutoLogout() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const logout = () => {
    localStorage.removeItem('token')
    router.replace('/')
  }

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(logout, AUTO_LOGOUT_TIME)
  }

  useEffect(() => {
    const events = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ]

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    )

    resetTimer() // start timer on load

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      )
    }
  }, [])
}
