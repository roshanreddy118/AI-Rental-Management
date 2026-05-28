'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, LayoutDashboard, Home, Users, IndianRupee,
  FileText, Wrench, Zap, Bot, Settings, LogOut, Menu, X, Bell, Moon, Sun
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

const ownerLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/properties', icon: Home, label: 'Properties' },
  { href: '/tenants', icon: Users, label: 'Tenants' },
  { href: '/rent', icon: IndianRupee, label: 'Rent' },
  { href: '/agreements', icon: FileText, label: 'Agreements' },
  { href: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/utilities', icon: Zap, label: 'Utilities' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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
    if (parsed.role !== 'owner') {
      router.push('/my-home')
      return
    }
    setUser(parsed)
    fetchNotifications()
    // Poll for notifications every 30 seconds
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

  const { theme, toggleTheme } = useTheme()

  if (!user) return null

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-surface-800 border-r border-surface-100 dark:border-surface-700 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white">LandlordOS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {ownerLinks.map((link) => {
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

        {/* User */}
        <div className="p-4 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {getInitials(user.fullName || user.full_name || 'U')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{user.fullName || user.full_name}</p>
              <p className="text-xs text-surface-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-surface-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-700 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-surface-600 dark:text-surface-300">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100 capitalize">
              {pathname.replace('/', '') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-500 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications && unreadCount > 0) markAllRead() }}
                className="relative w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-surface-400 text-center py-8">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={cn('px-4 py-3 border-b border-surface-50 last:border-0', !n.read && 'bg-primary-50/50')}>
                          <p className="text-sm font-medium text-surface-900">{n.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
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

        {/* Page Content */}
        <div className="flex-1 p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
