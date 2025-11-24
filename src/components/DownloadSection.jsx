import React from 'react'
import { useApp } from '../context/AppContext'

function DocCard({ doc }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded shadow p-4 flex flex-col items-start">
      <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">{doc.icon || '📄'}</div>
      <h4 className="font-semibold mt-2 text-slate-900 dark:text-slate-100">{doc.title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{doc.description || 'Dokumen resmi untuk referensi dan pembinaan mutu.'}</p>
      <div className="mt-4 w-full flex justify-end">
        <a href={doc.fileUrl} download className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">DOWNLOAD</a>
      </div>
    </div>
  )
}

export default function DownloadSection() {
  const { data } = useApp()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.documents.map(doc => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}
