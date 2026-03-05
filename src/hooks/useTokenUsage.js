'use client'
import { useState, useEffect } from 'react'
import { subscribeToTokenUsage, aggregateTokensByModel } from '@/lib/firebase/firestore'

export function useTokenUsage() {
  const [records, setRecords] = useState([])
  const [byModel, setByModel] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToTokenUsage((data) => {
      setRecords(data)
      setByModel(aggregateTokensByModel(data))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { records, byModel, loading }
}
