import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import useRecaptcha from '../hooks/useRecaptcha'

// Daftar Kota/Kabupaten di Jawa Timur
const KOTA_KABUPATEN_JATIM = [
  'Kota Surabaya', 'Kota Malang', 'Kota Kediri', 'Kota Blitar', 'Kota Probolinggo',
  'Kota Pasuruan', 'Kota Mojokerto', 'Kota Madiun', 'Kota Batu',
  'Kabupaten Gresik', 'Kabupaten Sidoarjo', 'Kabupaten Mojokerto', 'Kabupaten Jombang',
  'Kabupaten Nganjuk', 'Kabupaten Madiun', 'Kabupaten Magetan', 'Kabupaten Ngawi',
  'Kabupaten Bojonegoro', 'Kabupaten Tuban', 'Kabupaten Lamongan', 'Kabupaten Pamekasan',
  'Kabupaten Sumenep', 'Kabupaten Bangkalan', 'Kabupaten Sampang', 'Kabupaten Bondowoso',
  'Kabupaten Situbondo', 'Kabupaten Probolinggo', 'Kabupaten Pasuruan', 'Kabupaten Malang',
  'Kabupaten Lumajang', 'Kabupaten Jember', 'Kabupaten Banyuwangi', 'Kabupaten Kediri',
  'Kabupaten Blitar', 'Kabupaten Tulungagung', 'Kabupaten Trenggalek', 'Kabupaten Ponorogo',
  'Kabupaten Pacitan'
]

export default function Register() {
  const { register } = useApp()
  const [role, setRole] = useState('member')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [instansi, setInstansi] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const getRegisterToken = useRecaptcha('register')
  const getLoginToken = useRecaptcha('login')

  async function submit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Password tidak sama')
      return
    }
    const trimmedFullName = fullName.trim()
    
    if (!trimmedFullName) {
      setError('Nama lengkap wajib diisi')
      return
    }
    
    if (role === 'admin') {
      if (!city) {
        setError('Kota/Kabupaten wajib diisi untuk admin')
        return
      }
      if (!instansi) {
        setError('Instansi wajib diisi untuk admin')
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      // Get reCAPTCHA token for registration
      const recaptchaToken = await getRegisterToken()
      if (!recaptchaToken) {
        throw new Error('Validasi keamanan gagal, coba lagi.')
      }
      
      // Get login token for auto-login after registration
      const loginRecaptchaToken = await getLoginToken()
      
      const ok = await register(
        username,
        password,
        email,
        phone,
        role,
        undefined, // nik (tidak digunakan)
        trimmedFullName,
        role === 'admin' ? city : undefined,
        role === 'admin' ? instansi : undefined,
        recaptchaToken,
        loginRecaptchaToken,
        role === 'admin' ? adminCode.trim() : undefined,
      )
      if (ok) {
        if (role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/member', { replace: true })
        }
      } else {
        setError('Registrasi gagal')
      }
    } catch (err) {
      setError(err?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  const roleTitle = role === 'admin' ? 'Admin' : 'Member'
  const roleDesc = role === 'admin' 
    ? 'Akun admin untuk mengelola dan mengedit data akreditasi, indikator, dan dokumen.' 
    : 'Akun member untuk melihat data akreditasi, indikator, dan dokumen (read-only).'

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Pendaftaran Akun</h1>
          <p className="text-slate-600 dark:text-slate-400">Pilih tipe akun dan isi data diri Anda</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => { setRole('member'); setCity(''); setInstansi('') }}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              role === 'member'
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">👤 Member</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Akun member untuk melihat data akreditasi, indikator, dan dokumen (read-only).
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              role === 'admin'
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">🛠 Admin</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Akun admin untuk mengelola dan mengedit data akreditasi, indikator, dokumen, dan pengguna.
            </p>
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-slate-800 rounded shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Daftar sebagai {roleTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{roleDesc}</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">Nama Lengkap</label>
              <input 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                type="text" 
                required 
                className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" 
                placeholder="Nama lengkap Anda" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" placeholder="nama@contoh.com" />
            </div>
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">No. Telepon</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" placeholder="08xxxxxxxxxxxx" />
            </div>
            {role === 'admin' && (
              <>
                <div>
                  <label className="text-sm text-slate-700 dark:text-slate-300">Kota/Kabupaten</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                    className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  >
                    <option value="">Pilih Kota/Kabupaten</option>
                    {KOTA_KABUPATEN_JATIM.map(kota => (
                      <option key={kota} value={kota}>{kota}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-700 dark:text-slate-300">Instansi</label>
                  <select
                    value={instansi}
                    onChange={e => setInstansi(e.target.value)}
                    required
                    className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  >
                    <option value="">Pilih Instansi</option>
                    <option value="Dinkes Kabupaten/Kota">Dinkes Kabupaten/Kota</option>
                    <option value="Dinkes Provinsi Jatim">Dinkes Provinsi Jatim</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-700 dark:text-slate-300">Kode Admin</label>
                  <input
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    type="password"
                    className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    placeholder="Masukkan kode admin rahasia"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" placeholder="nama_pengguna" />
            </div>
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border px-3 py-2 pr-10 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  placeholder="Minimal 6 karakter"
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
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">Konfirmasi Password</label>
              <div className="mt-1 relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full border px-3 py-2 pr-10 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  placeholder="Ulang password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500 dark:text-slate-300"
                  aria-label={showConfirm ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}
            <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60">{loading ? 'Memproses...' : 'Daftar'}</button>
          </form>
          <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            Sudah punya akun? <Link className="text-primary-600 hover:underline font-semibold" to="/login">Login di sini</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
