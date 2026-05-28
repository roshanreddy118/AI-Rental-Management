export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Building2, Shield, Bot, Bell, FileText, Wrench, Home, Key, MapPin, Users } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { createServerClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createServerClient()
  const [{ count: ownerCount }, { count: propertyCount }, { count: tenantCount }, { data: rentData }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('rent_payments').select('amount').eq('status', 'paid'),
  ])

  const totalRent = (rentData || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0)
  const fmtRent = (n: number) => {
    if (n >= 10000000) return '\u20B9' + (n / 10000000).toFixed(1) + 'Cr'
    if (n >= 100000) return '\u20B9' + (n / 100000).toFixed(1) + 'L'
    if (n >= 1000) return '\u20B9' + Math.round(n / 1000) + 'K'
    return '\u20B9' + n
  }

  const stats = [
    { value: String(ownerCount || 0), label: 'Landlords' },
    { value: String(propertyCount || 0), label: 'Properties' },
    { value: String(tenantCount || 0), label: 'Active Tenants' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 overflow-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/30 dark:bg-amber-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-sky-100/20 dark:bg-sky-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white">LandlordOS</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors">
              Login
            </Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-full mb-6">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Made for Indian Landlords</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-surface-900 dark:text-white leading-tight mb-6">
                Your Properties,
                <br />
                <span className="text-emerald-600 dark:text-emerald-400">
                  One Dashboard
                </span>
              </h1>
              <p className="text-lg text-surface-600 dark:text-surface-300 mb-8 leading-relaxed">
                Ditch the notebooks and spreadsheets. Collect rent, manage tenants, 
                track maintenance & generate agreements — powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 text-center">
                  Start Free — No Card Needed
                </Link>
                <Link href="/login" className="border-2 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:border-emerald-300 dark:hover:border-emerald-600 font-semibold text-lg py-4 px-8 rounded-xl transition-all text-center">
                  I have an account
                </Link>
              </div>
              {/* Trust badges */}
              <div className="mt-10 flex items-center gap-6 text-sm text-surface-500 dark:text-surface-400">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>2-50 properties</span>
                </div>
              </div>
            </div>

            {/* Hero illustration - property card mockup */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/50 to-amber-100/50 dark:from-emerald-900/20 dark:to-amber-900/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-surface-900 dark:text-white">My Properties</h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">3 Active</span>
                </div>
                {[
                  { name: 'Koramangala Apt', units: '4 units', rent: '\u20B948,000/mo', color: 'bg-emerald-500' },
                  { name: 'HSR Layout PG', units: '8 beds', rent: '\u20B972,000/mo', color: 'bg-sky-500' },
                  { name: 'Whitefield Villa', units: '1 unit', rent: '\u20B925,000/mo', color: 'bg-amber-500' },
                ].map((prop, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                    <div className={`w-10 h-10 ${prop.color} rounded-lg flex items-center justify-center`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-white text-sm">{prop.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{prop.units}</p>
                    </div>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">{prop.rent}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-surface-100 dark:border-surface-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">Total Monthly</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{'\u20B9'}1,45,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar - real data from DB */}
      <section className="relative py-12 px-6 border-y border-surface-100 dark:border-surface-700/50 bg-surface-50/50 dark:bg-surface-800/30">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-surface-900 dark:text-white mb-4">
            Built for how Indian landlords work
          </h2>
          <p className="text-center text-surface-500 dark:text-surface-400 mb-12 max-w-xl mx-auto">
            No enterprise bloat. Just the tools you need to manage 2 to 50 properties efficiently.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Tenant Verification',
                desc: 'Aadhaar, PAN verification checklist. Track document submissions and verify tenants before move-in.',
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
              },
              {
                icon: Bell,
                title: 'Rent Collection',
                desc: 'Automatic rent reminders via email. Track payments, late fees, and payment history per unit.',
                color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20',
              },
              {
                icon: FileText,
                title: 'Auto Agreements',
                desc: 'AI-generated rental agreements following Indian tenancy laws. Ready to print and sign.',
                color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
              },
              {
                icon: Wrench,
                title: 'Maintenance Tracking',
                desc: 'Tenants raise requests, you track and resolve. No more lost WhatsApp messages.',
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
              },
              {
                icon: Bot,
                title: 'AI Assistant',
                desc: 'Ask anything - legal queries, rent calculations, notice drafting. Multilingual support.',
                color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
              },
              {
                icon: Building2,
                title: 'Multi-Property',
                desc: 'Manage apartments, PGs, houses, commercial spaces - all from one dashboard.',
                color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-surface-500 dark:text-surface-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-12 shadow-2xl shadow-emerald-900/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to simplify your rental management?
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Join landlords across India managing their properties smarter.
          </p>
          <Link href="/register" className="inline-block bg-white text-emerald-700 font-semibold text-lg py-4 px-8 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-surface-200 dark:border-surface-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-surface-700 dark:text-surface-300">LandlordOS</span>
          </div>
          <p className="text-sm text-surface-400">{'\u00A9'} 2026 LandlordOS. Built for owners and tenants.</p>
        </div>
      </footer>
    </div>
  )
}
