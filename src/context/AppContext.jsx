import React, { createContext, useContext, useEffect, useState } from 'react'
import { initialData } from '../data/sampleData'
import * as API from '../services/api'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('mutu-data')
    return saved ? JSON.parse(saved) : initialData
  })

  const [user, setUser] = useState(null)

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mutu-theme')
    if (saved) return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [useApi, setUseApi] = useState(() => !!import.meta.env.VITE_API_URL)

  useEffect(() => {
    if (!useApi) {
      localStorage.setItem('mutu-data', JSON.stringify(data))
    }
  }, [data, useApi])

  useEffect(() => {
    async function loadFromApi() {
      if (!useApi) return
      try {
        const [akr, inds, docs] = await Promise.all([
          API.getAkreditasi(),
          API.getIndikators(),
          API.getDocuments()
        ])
        setData({ akreditasi: akr, indikators: inds, documents: docs })
      } catch (e) {
        console.warn('API fetch failed, keeping local data as fallback but API remains enabled:', e)
        // Keep useApi true so that authentication/other features still hit the backend.
        // Consumers relying on data can handle empty/default state or retry manually.
      }
    }
    loadFromApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function initUser() {
      if (useApi) {
        const token = localStorage.getItem('mutu-token')
        if (token) {
          try {
            const me = await API.me()
            // me already contains id, username, role, email, phone
            setUser(me)
          } catch {}
        }
      } else {
        const saved = localStorage.getItem('mutu-user')
        if (saved) setUser({ username: saved })
      }
    }
    initUser()
  }, [useApi])

  useEffect(() => {
    localStorage.setItem('mutu-theme', theme)
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  async function login(email, password, recaptchaToken) {
    if (useApi) {
      const res = await API.login(email, password, recaptchaToken)
      setUser(res.user)
      return true
    }
    return false
  }

  async function register(username, password, email, phone, role = 'member', nik, fullName, city, instansi, recaptchaToken, loginRecaptchaToken, adminCode) {
    if (useApi) {
      await API.register(username, password, email, phone, role, nik, fullName, city, instansi, recaptchaToken, adminCode)
      if (loginRecaptchaToken) {
        const res = await API.login(email, password, loginRecaptchaToken)
        setUser(res.user)
      }
      return true
    }
    return false
  }

  async function logout() {
    if (useApi) await API.logout()
    localStorage.removeItem('mutu-user')
    setUser(null)
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // API-aware helpers (fallback to local update if API unavailable)
  async function saveAkreditasi(next) {
    if (useApi) {
      const res = await API.updateAkreditasi(next)
      setData(prev => ({ ...prev, akreditasi: res }))
    } else {
      setData(prev => ({ ...prev, akreditasi: { ...next } }))
    }
  }

  async function createIndicator(name = 'New indikator', capaian = 0, target = 100, date = null, region = null) {
    if (useApi) {
      const created = await API.createIndicator({ name, capaian, target, date, region })
      setData(prev => ({ ...prev, indikators: [...prev.indikators, created] }))
    } else {
      const id = Date.now()
      const status = Number(capaian) >= Number(target) ? 'Mencapai Target' : 'Tidak Mencapai Target'
      const row = { id, name, region, capaian, target, status, date }
      setData(prev => ({ ...prev, indikators: [...prev.indikators, row] }))
    }
  }

  async function updateIndicatorRow({ id, name, capaian, target, date = null, status, region = null }) {
    if (useApi) {
      const updated = await API.updateIndicator({ id, name, capaian, target, date, status, region })
      setData(prev => ({ ...prev, indikators: prev.indikators.map(i => (i.id === id ? updated : i)) }))
    } else {
      const computedStatus = status || (Number(capaian) >= Number(target) ? 'Mencapai Target' : 'Tidak Mencapai Target')
      setData(prev => ({
        ...prev,
        indikators: prev.indikators.map(i => (i.id === id
          ? { ...i, name, region, capaian, target, status: computedStatus, date }
          : i)),
      }))
    }
  }

  async function removeIndicator(id) {
    if (useApi) {
      await API.deleteIndicator(id)
    }
    setData(prev => ({ ...prev, indikators: prev.indikators.filter(i => i.id !== id) }))
  }

  async function replaceIndicators(items) {
    if (useApi) {
      const replaced = await API.replaceIndicators(items)
      setData(prev => ({ ...prev, indikators: replaced }))
    } else {
      const mapped = items.map((r, idx) => {
        const name = r.name || `Indikator ${idx + 1}`
        const capaian = Number(r.capaian ?? 0)
        const target = Number(r.target ?? 100)
        const status = capaian >= target ? 'Mencapai Target' : 'Tidak Mencapai Target'
        const date = r.date ?? null
        return { id: Date.now() + idx, name, capaian, target, status, date }
      })
      setData(prev => ({ ...prev, indikators: mapped }))
    }
  }

  async function uploadDocument(file, title, description) {
    if (useApi) {
      const doc = await API.uploadDocument(file, title, description)
      setData(prev => ({ ...prev, documents: [doc, ...prev.documents] }))
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        const newDoc = { id: Date.now(), title: title || file.name, description: description || '', fileUrl: base64, icon: '+' }
        setData(prev => ({ ...prev, documents: [newDoc, ...prev.documents] }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function renameDocument(id, updates = {}) {
    const payload = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.description !== undefined) payload.description = updates.description
    let updated = null
    if (useApi && Object.keys(payload).length) {
      updated = await API.updateDocument(id, payload)
    }
    setData(prev => ({
      ...prev,
      documents: prev.documents.map(d => {
        if (d.id !== id) return d
        const next = { ...d }
        if (payload.title !== undefined) next.title = payload.title
        if (payload.description !== undefined) next.description = payload.description
        if (updated) {
          if (updated.title !== undefined) next.title = updated.title
          if (updated.description !== undefined) next.description = updated.description
        }
        return next
      })
    }))
  }

  async function removeDocument(id) {
    if (useApi) {
      await API.deleteDocument(id)
    }
    setData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }))
  }

  async function getUsers() {
    if (useApi) {
      return API.getUsers()
    }
    return []
  }

  async function deleteUser(id) {
    if (useApi) {
      return API.deleteUser(id)
    }
    return null
  }

  async function updateUser(id, payload) {
    if (useApi) {
      return API.updateUser(id, payload)
    }
    return null
  }

  async function createAdminUser({ username, password, email, phone, fullName, city, instansi }, recaptchaToken) {
    if (useApi) {
      return API.createAdminUser({ username, password, email, phone, fullName, city, instansi }, recaptchaToken)
    }
    return null
  }

  async function createMemberUser({ username, password, email, phone, fullName }, recaptchaToken) {
    if (useApi) {
      // use register endpoint with explicit member role, but do not log in as this user
      return API.register(username, password, email, phone, 'member', null, fullName, null, null, recaptchaToken)
    }
    return null
  }

  async function updateProfile(updates) {
    if (useApi) {
      const me = await API.updateProfile(updates)
      setUser(me)
      return me
    }
    return null
  }

  const value = {
    data,
    setData, // still exposed for legacy local updates
    user,
    login,
    register,
    logout,
    theme,
    toggleTheme,
    useApi,
    saveAkreditasi,
    createIndicator,
    updateIndicatorRow,
    removeIndicator,
    replaceIndicators,
    uploadDocument,
    renameDocument,
    removeDocument,
    getUsers,
    deleteUser,
    createAdminUser,
    createMemberUser,
    updateUser,
    updateProfile,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
