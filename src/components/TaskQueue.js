'use client'
import { ListTodo, AlertTriangle, Loader2, CheckCircle2, Clock, CheckSquare } from 'lucide-react'
import { useTaskQueue } from '@/hooks/useTaskQueue'

export default function TaskQueue() {
  const { tasks, loading } = useTaskQueue()

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ListTodo size={20} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Active Task Queue</h2>
        </div>
        <span className="text-xs text-zinc-400">{tasks.length} tasks</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-zinc-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
          No tasks in queue.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }) {
  const shortId = task.id?.slice(-4).toUpperCase() || '----'

  return (
    <div className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
          {shortId}
        </div>
        <div>
          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{task.title}</div>
          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
            <span className="font-medium">{task.assignedTo || 'Unassigned'}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className={task.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : task.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}>
              {task.priority?.toUpperCase() || 'NORMAL'}
            </span>
          </div>
        </div>
      </div>
      <StatusChip status={task.status} />
    </div>
  )
}

function StatusChip({ status }) {
  const configs = {
    'in-progress': {
      className: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      icon: <Loader2 size={12} className="animate-spin" />,
      label: 'In Progress',
    },
    pending: {
      className: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
      icon: <Clock size={12} />,
      label: 'Pending',
    },
    complete: {
      className: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      icon: <CheckCircle2 size={12} />,
      label: 'Complete',
    },
    escalated: {
      className: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
      icon: <AlertTriangle size={12} />,
      label: 'Escalated',
    },
  }

  const config = configs[status] || configs.pending

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${config.className}`}>
      {config.icon}
      {config.label}
    </div>
  )
}
