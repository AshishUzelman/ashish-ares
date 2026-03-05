'use client'
import { useState, useEffect } from 'react'
import { subscribeToTasks } from '@/lib/firebase/firestore'

export function useTaskQueue() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToTasks((data) => {
      setTasks(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { tasks, loading, error }
}
