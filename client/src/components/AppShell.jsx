import { NavLink, Outlet } from 'react-router-dom'
import { CreditCard, LogOut, QrCode, ScanLine, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/dashboard', label: 'My Card', icon: CreditCard },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/scan', label: 'Scan', icon: ScanLine },
]

export default function AppShell() {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-fuchsia-500">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gradient">Digital Wallet</span>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl bg-white/5 p-1 md:flex">
            {TABS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/50 lg:block">{user?.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="btn-ghost">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <Outlet />
      </div>

      <nav className="glass fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl p-1.5 md:hidden">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/50'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}