'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
            {icon}
          </div>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={cn(
            'input-field',
            icon && 'pl-11',
            isPassword && 'pr-11',
            error && 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'px-4 py-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-all',
  }

  const sizes = {
    sm: '!py-2 !px-4 text-sm',
    md: '',
    lg: '!py-4 !px-8 text-lg',
  }

  return (
    <button
      className={cn(variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
      ) : icon ? (
        <span className="mr-2 inline-flex">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{label}</label>
      )}
      <select className={cn('input-field', className)} {...props}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{label}</label>
      )}
      <textarea
        className={cn('input-field min-h-[100px] resize-y', error && 'border-red-300', className)}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass-card p-6', className)}>
      {children}
    </div>
  )
}

export function Badge({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  }
  return <span className={variants[variant]}>{children}</span>
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-8 max-w-lg w-full mx-4 animate-slide-up !bg-white dark:!bg-surface-800">
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4 text-surface-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">{title}</h3>
      <p className="text-surface-500 dark:text-surface-400 text-sm max-w-md mb-6">{description}</p>
      {action}
    </div>
  )
}
