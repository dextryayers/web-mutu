import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import useRecaptcha from '../hooks/useRecaptcha'

export default function Login() {
  const { login, user, theme } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const getLoginToken = useRecaptcha('login')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = await getLoginToken()
      if (!token) {
        throw new Error('Validasi keamanan gagal, coba lagi.')
      }
      const ok = await login(email, password, token)
      if (ok) {
        // Will redirect based on user role after state updates
        // Navigation happens in useEffect below
      } else {
        setError('Login gagal. Cek email/password.')
      }
    } catch (err) {
      setError(err?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  // Redirect after successful login based on user role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'member') {
        navigate('/member', { replace: true })
      }
    }
  }, [user, navigate])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded shadow p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Silahkan Login</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Masuk untuk mengelola data.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-300">Email</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" 
              placeholder="nama@contoh.com"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-300">Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border px-3 py-2 pr-10 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500 dark:text-slate-300"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60">{loading ? 'Memproses...' : 'Login'}</button>
        </form>
        <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
          Belum punya akun? <Link className="text-primary-600" to="/register">Daftar</Link>
        </div>
      </div>
    </div>
  )
}
