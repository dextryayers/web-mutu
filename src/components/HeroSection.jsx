import React from 'react'
import dokterImg from '../../images/dokter.webp'

export default function HeroSection() {
  return (
    <section className="hero-bg py-20">
      <div className="container mx-auto px-4">
        <div className="bg-white/85 dark:bg-slate-800/85 rounded-2xl p-8 md:p-12 shadow-lg border border-slate-100/80 dark:border-slate-700/70 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary-900 dark:text-primary-200 mt-12 ml-8">PELAYANAN KESEHATAN RUJUKAN</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 ml-8">DINAS KESEHATAN PROVINSI JAWA TIMUR</p>
              <p className="mt-4 text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 mt-5 ml-8">SELAYANG PANDANG</p>
              <p className="mt-4 text-slate-700 dark:text-slate-200 max-w-xl ml-8">Dashboard Ringkasan Gambaran Pelayanan Kesehatan Rujukan</p>
              <div className="mt-6 ml-8 flex gap-3">
                <a
                  href="#akreditasi"
                  className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Lihat Akreditasi
                </a>
                <a
                  href="#indikator"
                  className="inline-flex items-center border border-primary-600/70 text-primary-700 dark:text-primary-200 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-50/70 dark:hover:bg-primary-900/30 transition-colors"
                >
                  Lihat Indikator
                </a>
              </div>
            </div>
            <div className="mt-6 md:mt-0 w-full md:w-80">
              <div className="bg-primary-50/80 dark:bg-slate-900/80 border border-primary-100/80 dark:border-slate-700 rounded-2xl p-4 text-center shadow-md animate-fade-in">
                <img alt="hospital" src={dokterImg} className="w-full h-50 object-cover rounded-xl animate-float" />
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
