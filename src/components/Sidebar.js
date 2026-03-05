import Link from 'next/link'
import { Activity, LayoutDashboard, BrainCircuit, CheckSquare, Settings } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black h-screen sticky top-0 flex flex-col pt-6">
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-1.5 rounded-lg flex items-center justify-center">
          <BrainCircuit size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight">ARES Network</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 text-sm font-medium">
        <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Overview" active />
        <NavItem href="/agents" icon={<Activity size={18} />} label="Agent State" />
        <NavItem href="/tasks" icon={<CheckSquare size={18} />} label="Task Queue" />
        <div className="pt-8">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">System</p>
          <NavItem href="/config" icon={<Settings size={18} />} label="Configuration" />
        </div>
      </nav>

      <SystemStatusFooter />
    </div>
  )
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active
          ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function SystemStatusFooter() {
  return (
    <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500 font-medium tracking-wide">SYSTEM STATUS</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All Systems Nominal</span>
      </div>
    </div>
  )
}
