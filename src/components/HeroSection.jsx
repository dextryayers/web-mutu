import React from 'react'
import dokterImg from '../../images/dokter.webp'

export default function HeroSection() {
  return (
    <section className="hero-bg py-20">
      <div className="container mx-auto px-4">
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-8 md:p-12 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary-900 dark:text-primary-200">MUTU PELAYANAN RUMAH SAKIT</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">DINAS KESEHATAN PROVINSI JAWA TIMUR</p>
              <p className="mt-4 text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">SELAYANG PANDANG</p>
              <p className="mt-4 text-slate-700 dark:text-slate-200 max-w-xl">Dashboard ringkasan capaian mutu dan akreditasi rumah sakit di Jawa Timur. Data ini dapat diedit secara real-time oleh admin untuk presentasi dan pengelolaan dokumen.</p>
              <div className="mt-6">
                <a href="#akreditasi" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-md mt-6">Lihat Akreditasi</a>
              </div>
            </div>
            <div className="mt-6 md:mt-0 w-full md:w-80">
              <div className="bg-primary-50 dark:bg-slate-900 border border-primary-100 dark:border-slate-700 rounded-lg p-4 text-center">
                <img alt="hospital" src={dokterImg} className="w-full h-50 object-cover rounded animate-float" />
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
