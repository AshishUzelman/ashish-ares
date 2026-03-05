import AgentStatus from '@/components/AgentStatus'
import MemoryState from '@/components/MemoryState'
import Sidebar from '@/components/Sidebar'
import TaskQueue from '@/components/TaskQueue'
import TokenUsage from '@/components/TokenUsage'
import SystemHeader from '@/components/SystemHeader'

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <SystemHeader />
          <AgentStatus />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TaskQueue />
            </div>
            <div className="space-y-8">
              <TokenUsage />
              <MemoryState />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
