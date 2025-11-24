import React, { useEffect, useMemo, useState } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { useApp } from '../context/AppContext'
import * as API from '../services/api'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function AkreditasiSection() {
  const { data } = useApp()
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [local, setLocal] = useState({ ...data.akreditasi })

  const years = useMemo(() => {
    const list = []
    for (let y = 2025; y <= 2037; y += 1) list.push(y)
    return list
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadForPeriod() {
      if (!month || !year) {
        setLocal({ ...data.akreditasi })
        return
      }
      try {
        const akr = await API.getAkreditasi({ year, month })
        if (!ignore && akr && typeof akr === 'object') {
          setLocal({
            paripurna: Number(akr.paripurna ?? 0),
            utama: Number(akr.utama ?? 0),
            madya: Number(akr.madya ?? 0),
          })
        }
      } catch (e) {
        console.warn('Failed to load akreditasi for period in public chart', e)
        if (!ignore) setLocal({ ...data.akreditasi })
      }
    }
    loadForPeriod()
    return () => {
      ignore = true
    }
  }, [month, year, data.akreditasi])

  const pieData = {
    labels: ['Paripurna', 'Utama', 'Madya'],
    datasets: [
      {
        data: [local.paripurna, local.utama, local.madya],
        backgroundColor: ['#1e40af', '#3b82f6', '#10b981'],
        hoverOffset: 6
      }
    ]
  }

  const barData = {
    labels: ['Paripurna', 'Utama', 'Madya'],
    datasets: [
      {
        label: 'Persentase Akreditasi',
        data: [local.paripurna, local.utama, local.madya],
        backgroundColor: ['#1e40af', '#3b82f6', '#10b981']
      }
    ]
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 md:p-8">
        <h2 className="text-xl font-bold text-primary-800 dark:text-primary-200">Ringkasan Akreditasi Rumah Sakit</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Persentase akreditasi di Jawa Timur</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-2 py-1 border rounded text-sm w-full sm:w-32 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          >
            <option value="">Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="px-2 py-1 border rounded text-sm w-full sm:w-28 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          >
            <option value="">Tahun</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-2">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded">
              <Bar data={barData} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded">
              <Pie data={pieData} />
            </div>
            <div className="mt-4">
              <a href="#" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">Data Lengkap Akreditasi RS</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
