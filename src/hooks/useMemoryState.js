'use client'
import { useState, useEffect } from 'react'
import { subscribeToMemory } from '@/lib/firebase/firestore'

const DEFAULT_STATE = {
  records: [],
  activeRules: [],
  hoursSinceLastSave: null,
  isStale: true,
  loading: true,
}

export function useMemoryState() {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    const unsubscribe = subscribeToMemory((data) => {
      // All computation including Date.now() runs inside the async Firestore
      // callback — never during render, satisfying react-hooks/purity
      const now = Date.now()

      const activeRules = data.filter((r) => r.type === 'learned_rule' && !r.archivedAt)

      const lastSaveMillis = data
        .filter((r) => r.type === 'session_summary')
        .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
        [0]?.timestamp?.toMillis?.() || null

      const hoursSinceLastSave = lastSaveMillis
        ? Math.floor((now - lastSaveMillis) / 1000 / 60 / 60)
        : null

      // null = no Drive save on record → stale per SOUL_ARES.md
      const isStale = hoursSinceLastSave === null || hoursSinceLastSave > 24

      setState({ records: data, activeRules, hoursSinceLastSave, isStale, loading: false })
    })
    return () => unsubscribe()
  }, [])

  return state
}
