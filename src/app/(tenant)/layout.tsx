'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Home, IndianRupee, FileText, Wrench, Zap, Bot, Settings, LogOut, Menu, X, Bell, Moon, Sun
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

const tenantLinks = [
  { href: '/my-home', icon: Home, label: 'My Home' },
  { href: '/my-rent', icon: IndianRupee, label: 'My Rent' },
  { href: '/my-agreement', icon: FileText, label: 'My Agreement' },
  { href: '/my-maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/my-utilities', icon: Zap, label: 'Utilities' },
  { href: '/my-assistant', icon: Bot, label: 'AI Assistant' },
]

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(stored)
    if (parsed.role !== 'tenant') {
      router.push('/dashboard')
      return
    }
    setUser(parsed)
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [router, fetchNotifications])

  const markAllRead = async () => {
    const token = localStorage.getItem('token')
    await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-surface-800 border-r border-surface-100 dark:border-surface-700 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white">LandlordOS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 mb-4">
          <div className="px-4 py-2 bg-accent-50 dark:bg-accent-900/30 rounded-lg">
            <span className="text-xs font-medium text-accent-600 dark:text-accent-400">Tenant Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tenantLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700">
            <div className="w-9 h-9 rounded-full bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-700 dark:text-accent-300">
                {getInitials(user.fullName || user.full_name || 'T')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{user.fullName || user.full_name}</p>
              <p className="text-xs text-surface-400">Tenant</p>
            </div>
            <button onClick={handleLogout} className="text-surface-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-surface-600 dark:text-surface-300">
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/my-home" className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100 capitalize">
              {pathname.replace('/my-', '').replace('-', ' ') || 'Home'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-500 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications && unreadCount > 0) markAllRead() }}
                className="relative w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-500 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-surface-800">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-surface-400 text-center py-8">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={cn('px-4 py-3 border-b border-surface-50 dark:border-surface-700 last:border-0', !n.read && 'bg-primary-50/50 dark:bg-primary-900/20')}>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{n.title}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-surface-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
