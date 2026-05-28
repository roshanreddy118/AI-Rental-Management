'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, User, Phone, ShieldCheck, Home } from 'lucide-react'
import { Input, Button } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // Send OTP for email verification
      const res = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.fullName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code')
        return
      }

      setStep('otp')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: 'owner',
          otp,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.fullName }),
      })
      if (res.ok) {
        setError('')
        setOtp('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to resend code')
      }
    } catch {
      setError('Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-6 left-6 p-2 rounded-lg hover:bg-surface-100 transition-colors" title="Home">
          <Home className="w-5 h-5 text-surface-600" />
        </Link>
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">LandlordOS</span>
          </div>

          {step === 'form' ? (
            <>
              <h1 className="text-2xl font-bold text-surface-900 mb-2">Create your account</h1>
              <p className="text-surface-500 mb-8">Start managing your properties smarter</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-surface-900 mb-2">Verify your email</h1>
              <p className="text-surface-500 mb-8">We sent a 6-digit code to <strong>{form.email}</strong></p>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <Input
                label="Full Name"
                placeholder="Rajesh Kumar"
                icon={<User className="w-4 h-4" />}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="rajesh@example.com"
                icon={<Mail className="w-4 h-4" />}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+91 98765 43210"
                icon={<Phone className="w-4 h-4" />}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                icon={<Lock className="w-4 h-4" />}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                icon={<Lock className="w-4 h-4" />}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                Verify Email & Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                icon={<ShieldCheck className="w-4 h-4" />}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
              />

              <Button type="submit" loading={loading} className="w-full">
                Verify & Complete Registration
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={handleResendOTP} className="text-primary-600 font-medium hover:underline">
                  Resend Code
                </button>
                <button type="button" onClick={() => { setStep('form'); setOtp(''); setError('') }} className="text-surface-500 hover:text-surface-700">
                  Change Email
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Log in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-surface-400">
            Tenant? Ask your landlord for an invite link.
          </p>
        </div>
      </div>

      {/* Right - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Property management,<br />simplified.</h2>
          <div className="space-y-4">
            {['Track rent from all properties in one place', 'Auto-generate Indian rental agreements', 'Verify tenants with document checklists', 'AI assistant for legal queries & drafting'].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
