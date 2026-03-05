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

  // Safely get timestamp of the last session summary
  const lastSave = records
    .filter((r) => r.type === 'session_summary')
    .sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || 0;
      return timeB - timeA;
    })[0]?.timestamp

  const [hoursSinceLastSave, setHoursSinceLastSave] = useState(null)
  const [isStale, setIsStale] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!lastSave) {
      setHoursSinceLastSave(null)
      setIsStale(true) // no save on record = stale per SOUL_ARES.md
      return
    }

    const millis = lastSave.toMillis?.()
    if (!millis) return

    const hours = Math.floor((Date.now() - millis) / 1000 / 60 / 60)
    setHoursSinceLastSave(hours)
    setIsStale(hours > 24)
  }, [lastSave])

  return { records, activeRules, hoursSinceLastSave, isStale, loading }
}
