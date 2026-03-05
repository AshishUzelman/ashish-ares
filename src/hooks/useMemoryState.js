'use client'
import { useState, useEffect } from 'react'
import { subscribeToMemory } from '@/lib/firebase/firestore'

export function useMemoryState() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToMemory((data) => {
      setRecords(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const activeRules = records.filter((r) => r.type === 'learned_rule' && !r.archivedAt)
  const lastSave = records
    .filter((r) => r.type === 'session_summary')
    .sort((a, b) => b.timestamp?.toMillis?.() - a.timestamp?.toMillis?.())
    [0]?.timestamp

  // Returns hours since last save, or null if no record exists
  const hoursSinceLastSave = lastSave
    ? Math.floor((Date.now() - lastSave.toMillis()) / 1000 / 60 / 60)
    : null

  const isStale = hoursSinceLastSave === null || hoursSinceLastSave > 24

  return { records, activeRules, hoursSinceLastSave, isStale, loading }
}
