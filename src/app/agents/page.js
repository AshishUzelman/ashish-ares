import AgentStatus from '@/components/AgentStatus'
import Sidebar from '@/components/Sidebar'
import SystemHeader from '@/components/SystemHeader'

export default function AgentsPage() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <SystemHeader />
          <div className="bg-white dark:bg-black rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Agent Command Center</h1>
              <p className="text-zinc-500 mt-1">Detailed view of all active internal and external agents across the ARES network.</p>
            </div>
            <AgentStatus />
          </div>
        </div>
      </main>
    </div>
  )
}
