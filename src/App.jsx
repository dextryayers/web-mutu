import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import AkreditasiSection from './components/AkreditasiSection'
import IndikatorTable from './components/IndikatorTable'
import DownloadSection from './components/DownloadSection'
import Footer from './components/Footer'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  const { user } = useApp()
  const location = useLocation()

  function ScrollToHash(){
    const location = useLocation()
    useEffect(() => {
      if (location.hash) {
        const id = location.hash.replace('#','')
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }, [location])
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ScrollToHash />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <section id="akreditasi">
                  <AkreditasiSection />
                </section>
                <section id="indikator" className="py-12">
                  <div className="container mx-auto px-4">
                    <IndikatorTable />
                  </div>
                </section>
                <section id="dokumen" className="py-12">
                  <div className="container mx-auto px-4">
                    <DownloadSection />
                  </div>
                </section>
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' 
                ? <AdminDashboard /> 
                : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/member" 
            element={
              user && user.role === 'member' 
                ? <MemberDashboard /> 
                : <Navigate to="/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {location.pathname !== '/admin' && location.pathname !== '/member' && <Footer />}
    </div>
  )
}
