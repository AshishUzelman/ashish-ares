'use client'
import { BrainCircuit, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAgentState } from '@/hooks/useAgentState'

export default function AgentStatus() {
  const { agents, loading } = useAgentState()

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Agent Fleet Status</h2>
          <p className="text-sm text-zinc-500 mt-1">Real-time status of the ARES multi-agent network</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Sync
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-zinc-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
          No agents registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent }) {
  const iconClass = {
    active: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    idle: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    error: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  }[agent.status] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconClass}`}>
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{agent.name}</h3>
            <div className="text-xs text-zinc-500">{agent.model || agent.tier}</div>
          </div>
        </div>
        <StatusBadge status={agent.status} loops={agent.currentLoopCount || 0} />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 text-sm">
        <div className="text-xs text-zinc-500 mb-1 font-medium tracking-wide">CURRENT TASK</div>
        <div className="truncate text-zinc-800 dark:text-zinc-200">
          {agent.activeTaskId || 'No active task'}
        </div>
      </div>

      {/* Loop Guard warning — SOUL_ARES.md: warn at 2, halt at 3 */}
      {agent.currentLoopCount >= 2 && (
        <LoopGuardWarning loops={agent.currentLoopCount} />
      )}
    </div>
  )
}

function LoopGuardWarning({ loops }) {
  if (loops >= 3) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
        <AlertCircle size={12} />
        [ESCALATE: HUMAN REVIEW] — Loop Guard triggered (loop {loops}/3)
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
      <AlertTriangle size={12} />
      Loop Guard warning — loop {loops}/3
    </div>
  )
}

function StatusBadge({ status, loops }) {
  if (loops >= 3) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
        <AlertCircle size={12} />
        Loop Guard
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
        <Loader2 size={12} className="animate-spin" />
        Processing
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
        <AlertCircle size={12} />
        Error
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
      <CheckCircle2 size={12} />
      Idle
    </div>
  )
}
