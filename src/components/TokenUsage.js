'use client'
import { Zap, Loader2 } from 'lucide-react'
import { useTokenUsage } from '@/hooks/useTokenUsage'

// Map internal model IDs to display labels
const MODEL_LABELS = {
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-opus-4-6': 'Claude Opus 4.6',
  'claude-haiku-4-5': 'Claude Haiku 4.5',
  'gemma3:8b': 'Gemma 3 8B (Local)',
  'gemma3:27b': 'Gemma 3 27B (Local)',
}

const MODEL_COLORS = {
  'claude-sonnet-4-6': 'bg-amber-500',
  'claude-opus-4-6': 'bg-orange-500',
  'claude-haiku-4-5': 'bg-yellow-500',
  'gemma3:8b': 'bg-indigo-500',
  'gemma3:27b': 'bg-violet-500',
}

export default function TokenUsage() {
  const { byModel, loading } = useTokenUsage()

  const models = Object.entries(byModel)
  const maxTokens = Math.max(...models.map(([, v]) => v.totalTokens), 1)

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
          <Zap size={20} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Token Usage</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20 text-zinc-400 text-sm gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      ) : models.length === 0 ? (
        <div className="text-center text-zinc-400 text-sm py-6">No token usage recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {models.map(([modelId, usage]) => {
            const label = MODEL_LABELS[modelId] || modelId
            const barColor = MODEL_COLORS[modelId] || 'bg-zinc-500'
            const pct = Math.round((usage.totalTokens / maxTokens) * 100)
            return (
              <div key={modelId}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-semibold">{(usage.totalTokens / 1000).toFixed(1)}k</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2">
                  {/* width driven by CSS custom property to avoid inline style */}
                  <div
                    className={`${barColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
