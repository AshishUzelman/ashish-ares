'use client'
import { useState, useEffect } from 'react'
import { subscribeToAgentState } from '@/lib/firebase/firestore'

export function useAgentState() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAgentState((data) => {
      setAgents(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { agents, loading, error }
}
