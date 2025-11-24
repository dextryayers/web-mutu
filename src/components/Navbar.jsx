import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import logo from '../../images/log1.png' // Updated path to point to the `images` folder

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout, theme, toggleTheme } = useApp()

  return (
    <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between"> {/* Increased padding for larger header */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-16 w-auto" /> {/* Increased logo size */}
          <div>
            <div className="text-primary-800 dark:text-primary-200 font-bold text-lg">MUTU PELAYANAN RUMAH SAKIT</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">DINAS KESEHATAN PROVINSI JAWA TIMUR</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-slate-700 dark:text-slate-200">Home</Link>
          <Link to="/#akreditasi" className="text-slate-700 dark:text-slate-200">Akreditasi</Link>
          <Link to="/#indikator" className="text-slate-700 dark:text-slate-200">Indikator</Link>
          <Link to="/#dokumen" className="text-slate-700 dark:text-slate-200">Dokumen</Link>
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/member'}
              className="text-primary-700 dark:text-primary-300 font-medium"
            >
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="text-primary-700 dark:text-primary-300">Login</Link>
          )}
          <button onClick={toggleTheme} aria-label="Toggle dark mode" className="text-slate-700 dark:text-slate-200">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </nav>

        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-md bg-primary-600 text-white">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white/90 dark:bg-slate-900/90 shadow-md">
          <div className="px-4 py-3 flex flex-col space-y-2">
            <Link to="/" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Home</Link>
            <Link to="/#akreditasi" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Akreditasi</Link>
            <Link to="/#indikator" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Indikator</Link>
            <Link to="/#dokumen" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Dokumen</Link>
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/member'}
                  onClick={() => setOpen(false)}
                  className="text-primary-700 dark:text-primary-300"
                >
                  Dashboard
                </Link>
                <button onClick={() => logout()} className="text-red-500">Logout</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-primary-700 dark:text-primary-300">Login</Link>
            )}
            <button onClick={toggleTheme} aria-label="Toggle dark mode" className="text-slate-700 dark:text-slate-200 text-left">{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
          </div>
        </div>
      )}
    </header>
  )
}
