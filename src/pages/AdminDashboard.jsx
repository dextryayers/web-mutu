import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import * as API from '../services/api'
import ChartEditor from '../components/ChartEditor'
import DataManager from '../components/DataManager'
import UserManagement from '../components/UserManagement'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, logout, user, updateProfile } = useApp()
  const [tab, setTab] = useState('charts')
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Admin Dashboard</h2>
          {user && <p className="text-slate-600 dark:text-slate-400 mt-1">Selamat datang, <span className="font-semibold">{user.username}</span>!</p>}
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <aside className="md:col-span-1">
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl p-4 sticky top-4 shadow-sm border border-slate-100/80 dark:border-slate-700/70">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-sm uppercase tracking-wide">Menu</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setTab('profile')} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === 'profile'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  🙍‍♂️ My Profile
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('charts')} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === 'charts'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Chart Editor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('table')} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === 'table'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📋 Indikator Data
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('docs')} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === 'docs'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📄 Documents
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('users')} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === 'users'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  👥 User Management
                </button>
              </li>
            </ul>
          </div>
        </aside>

        <div className="md:col-span-3">
          <div className="bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-md p-6 border border-slate-100/80 dark:border-slate-700/70">
            {tab === 'profile' && (
              <AdminProfilePanel user={user} updateProfile={updateProfile} />
            )}
            {tab === 'charts' && <ChartEditor />}
            {tab === 'table' && <DataManager />}
            {tab === 'docs' && <DataManager docsOnly />}
            {tab === 'users' && <UserManagement />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminProfilePanel({ user, updateProfile }) {
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      setUploadingPhoto(true)
      // Upload langsung via API agar tidak menambah ke daftar dokumen publik
      const doc = await API.uploadDocument(file, 'Foto Profil', `Foto profil admin ${user?.username || ''}`)
      setPhotoUrl(doc.fileUrl)
      // Simpan langsung ke profil
      await updateProfile({ photoUrl: doc.fileUrl })
      setMessage('Foto profil berhasil diperbarui')
    } catch (err) {
      console.error('Upload foto profil gagal', err)
      setError(err?.message || 'Gagal mengunggah foto profil')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateProfile({ email, phone, password: password || undefined })
      if (password) setPassword('')
      setMessage('Profil berhasil diperbarui')
    } catch (err) {
      console.error('Update profil admin gagal', err)
      setError(err?.message || 'Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-2xl font-semibold text-slate-600 dark:text-slate-300">
            {photoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={photoUrl} className="w-full h-full object-cover" />
            ) : (
              (user?.username || '?').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.username}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{user?.role}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Foto Profil</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploadingPhoto}
            className="text-sm"
          />
          {uploadingPhoto && <p className="text-xs text-slate-500 mt-1">Mengunggah foto...</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">No. Telepon</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Password Baru (opsional)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </form>
    </div>
  )
}
