'use client'

import { useState } from 'react'

export interface SpendWiseUser {
  id: number
  fullName: string
  email: string
}

interface AuthScreenProps {
  onAuthenticated: (user: SpendWiseUser) => void
}

const AUTH_API = 'http://localhost:8080/api/auth'

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? `${AUTH_API}/login` : `${AUTH_API}/register`
      const payload = mode === 'login' ? { email, password } : { fullName, email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please try again.')
        return
      }

      localStorage.setItem('spendwise_user', JSON.stringify(data))
      onAuthenticated(data)
    } catch {
      setError('Cannot reach SpendWise backend. Make sure Spring Boot is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121620] p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-white text-[#0B0E14] flex items-center justify-center font-bold text-lg">
            ✦
          </div>
          <span className="text-2xl font-bold tracking-tight">SpendWise</span>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 rounded-xl bg-[#0B0E14] p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null) }}
            className={`py-2 text-sm font-medium rounded-lg transition ${
              mode === 'login' ? 'bg-[#1E2433] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null) }}
            className={`py-2 text-sm font-medium rounded-lg transition ${
              mode === 'register' ? 'bg-[#1E2433] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Shree Lakshan"
                className="w-full rounded-xl bg-[#0B0E14] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-[#0B0E14] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-[#0B0E14] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In to SpendWise'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}