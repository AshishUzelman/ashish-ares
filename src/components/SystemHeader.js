'use client'
import { Database, ShieldAlert } from 'lucide-react'
import { useMemoryState } from '@/hooks/useMemoryState'
import { useState } from 'react'
import { db } from '@/lib/firebase/config'

export default function SystemHeader() {
  const { isStale } = useMemoryState()
  const [firestoreReady, setFirestoreReady] = useState(!!db)

  return (
    <header className="flex justify-between items-end pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">ARES Command Center</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Agentic Resource &amp; Execution System Orchestrator</p>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium">
        {isStale && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert size={16} />
            <span>Memory Stale — Save Needed</span>
          </div>
        )}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${firestoreReady
            ? 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800'
            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50'
          }`}>
          <Database size={16} className={firestoreReady ? 'text-emerald-500' : 'text-rose-500'} />
          <span>{firestoreReady ? 'Firestore Connected' : 'Firestore Disconnected'}</span>
        </div>
      </div>
    </header>
  )
}
