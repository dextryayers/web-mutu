import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import ChartEditor from '../components/ChartEditor'
import DataManager from '../components/DataManager'
import UserManagement from '../components/UserManagement'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, logout, user } = useApp()
  const [tab, setTab] = useState('charts')
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h2>
          {user && <p className="text-slate-600 dark:text-slate-400 mt-1">Selamat datang, {user.username}!</p>}
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Logout</button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <aside className="md:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded p-4 sticky top-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Menu</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setTab('charts')} 
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    tab === 'charts'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Chart Editor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('table')} 
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    tab === 'table'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📋 Indikator Data
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('docs')} 
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    tab === 'docs'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📄 Documents
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('users')} 
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    tab === 'users'
                      ? 'bg-primary-600 text-white'
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
          <div className="bg-white dark:bg-slate-800 rounded shadow p-6">
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
