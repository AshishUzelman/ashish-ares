'use client'
import { HardDrive, Loader2 } from 'lucide-react'
import { useMemoryState } from '@/hooks/useMemoryState'

export default function MemoryState() {
  const { activeRules, hoursSinceLastSave, isStale, loading } = useMemoryState()

  const saveLabel = hoursSinceLastSave === null
    ? 'Never'
    : hoursSinceLastSave === 0
    ? 'Less than 1 hour ago'
    : `${hoursSinceLastSave} hour${hoursSinceLastSave !== 1 ? 's' : ''} ago`

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg">
          <HardDrive size={20} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">System Memory</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20 text-zinc-400 text-sm gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-zinc-500">Last Drive Save</span>
            <span className={`font-semibold ${isStale ? 'text-rose-500' : 'text-emerald-500'}`}>
              {saveLabel}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-zinc-500">Active Rules</span>
            <span className="font-semibold">{activeRules.length}</span>
          </div>
          <button className="w-full mt-2 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black font-medium text-sm transition-opacity hover:opacity-90 cursor-pointer">
            Trigger Manual Backup
          </button>
        </div>
      )}
    </div>
  )
}
