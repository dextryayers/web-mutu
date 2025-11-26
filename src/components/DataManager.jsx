import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

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

export default function DataManager({ docsOnly = false }) {
  const {
    data,
    createIndicator,
    updateIndicatorRow,
    removeIndicator,
    replaceIndicators,
    uploadDocument,
    renameDocument,
    removeDocument,
  } = useApp()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [editingDoc, setEditingDoc] = useState(null)
  const [docForm, setDocForm] = useState({})
  const [docTitle, setDocTitle] = useState('')
  const [docDescription, setDocDescription] = useState('')
  const [docFile, setDocFile] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const importRef = useRef(null)

  function startEdit(row) {
    setEditing(row.id)
    setForm({ ...row })
  }

  async function saveEdit() {
    try {
      await updateIndicatorRow({
        id: editing,
        name: form.name,
        region: form.region || null,
        capaian: form.capaian,
        target: form.target,
        date: form.date,
        status: form.status,
      })
      setEditing(null)
    } catch (err) {
      console.error('Failed to save indicator', err)
      alert('Gagal menyimpan indikator: ' + (err?.message || 'Server error'))
    }
  }

  async function addIndicator() {
    try {
      const today = new Date()
      const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      await createIndicator('New indikator', 0, 100, ym)
    } catch (err) {
      console.error('Failed to create indicator', err)
      alert('Gagal menambahkan indikator: ' + (err?.message || 'Server error'))
    }
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(data.indikators)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Indikator')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    saveAs(blob, 'indikator.xlsx')
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.text('Daftar Indikator', 10, 10)
    let y = 20
    data.indikators.forEach(i => {
      doc.text(`${i.name} - ${i.capaian}% - ${i.status}`, 10, y)
      y += 8
    })
    doc.save('indikator.pdf')
  }

  function importExcel(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const u8 = new Uint8Array(ev.target.result)
      const wb = XLSX.read(u8, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws)
      const mapped = json.map((row, idx) => {
        const name = row.name || row.Nama || row.INDIKATOR || row.Indikator || `Indikator ${idx + 1}`
        const capaian = Number(row.capaian ?? row.Capaian ?? row['CAPAIAN (%)'] ?? 0)
        const target = Number(row.target ?? row.Target ?? 100)
        const year = row.year ?? row.Year ?? row.Tahun
        const month = row.month ?? row.Month ?? row.Bulan
        let date = null
        if (year && month) {
          const y = parseInt(year, 10)
          const m = parseInt(month, 10)
          if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 1 && m <= 12) {
            date = `${y}-${String(m).padStart(2, '0')}-01`
          }
        }
        return { name, capaian, target, date }
      })
      replaceIndicators(mapped).catch(err => {
        console.error('Import failed', err)
        alert('Gagal mengimpor file: ' + (err?.message || 'Server error'))
      })
    }
    reader.readAsArrayBuffer(f)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setDocFile(f)
  }

  async function handleDocSubmit(e) {
    e.preventDefault()
    if (!docFile) {
      alert('Silakan pilih file terlebih dahulu')
      return
    }
    try {
      setUploadingDoc(true)
      await uploadDocument(docFile, docTitle.trim(), docDescription.trim())
      setDocTitle('')
      setDocDescription('')
      setDocFile(null)
      e.target.reset()
    } catch (err) {
      console.error('Upload document failed', err)
      alert('Gagal mengunggah dokumen: ' + (err?.message || 'Server error'))
    } finally {
      setUploadingDoc(false)
    }
  }

  if (docsOnly) {
    return (
      <div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Document Manager</h3>
        <div className="mt-4">
          <form onSubmit={handleDocSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                className="border rounded px-3 py-2 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                placeholder="Judul dokumen"
              />
              <input
                type="file"
                onChange={handleFileChange}
                className="text-sm"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
            </div>
            <textarea
              value={docDescription}
              onChange={e => setDocDescription(e.target.value)}
              className="border rounded px-3 py-2 w-full dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              placeholder="Deskripsi singkat (opsional)"
              rows={3}
            />
            <button disabled={uploadingDoc} type="submit" className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-60">
              {uploadingDoc ? 'Mengunggah...' : 'Upload Dokumen'}
            </button>
          </form>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.documents.map(d => (
              <div key={d.id} className="p-3 border rounded flex justify-between items-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex-1 pr-4">
                  {editingDoc === d.id ? (
                    <div className="space-y-2">
                      <input value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} className="border px-2 py-1 rounded w-full dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
                      <textarea value={docForm.description || ''} onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))} className="border px-2 py-1 rounded w-full dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" rows={3} />
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{d.title}</div>
                      {d.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{d.description}</p>}
                    </>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a href={d.fileUrl} download className="px-3 py-1 bg-primary-600 text-white rounded">Download</a>
                  {editingDoc === d.id ? (
                    <div className="flex gap-2">
                      <button onClick={async () => { await renameDocument(d.id, { title: docForm.title, description: docForm.description }); setEditingDoc(null) }} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-200 rounded">Simpan</button>
                      <button onClick={() => setEditingDoc(null)} className="px-3 py-1 border rounded dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Batal</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingDoc(d.id); setDocForm({ ...d }) }} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-200 rounded">Edit</button>
                      <button onClick={() => removeDocument(d.id)} className="px-3 py-1 bg-red-50 dark:bg-red-900/30 dark:text-red-200 rounded">Hapus</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Table Data Editor</h3>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={addIndicator} className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Tambah Indikator</button>
        <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
        <button onClick={() => importRef.current && importRef.current.click()} className="px-3 py-2 border rounded-full text-sm dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Impor Excel</button>
        <button onClick={exportExcel} className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Export Excel</button>
        <button onClick={exportPDF} className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Export PDF</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Nama</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Kab/Kota</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Capaian</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Target</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Periode</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Status</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.indikators.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/70 transition-colors">
                <td className="py-2">
                  {editing === row.id ? (
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.name}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <select
                      value={form.region || ''}
                      onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                      className="border px-2 py-1 rounded w-48 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    >
                      <option value="">Pilih Kab/Kota (opsional)</option>
                      {KOTA_KABUPATEN_JATIM.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.region || '-'}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input type="number" value={form.capaian} onChange={e => setForm(f => ({ ...f, capaian: Number(e.target.value) }))} className="border px-2 py-1 rounded w-24 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.capaian}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input
                      type="number"
                      value={form.target}
                      onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                      className="border px-2 py-1 rounded w-24 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.target}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input
                      type="month"
                      value={form.date ? String(form.date).slice(0, 7) : ''}
                      onChange={e => {
                        const v = e.target.value
                        setForm(f => ({ ...f, date: v ? `${v}-01` : null }))
                      }}
                      className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />
                  ) : (
                    <span className="text-slate-700 dark:text-slate-300">
                      {row.date ? new Date(row.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                      <option>Mencapai Target</option>
                      <option>Tidak Mencapai Target</option>
                    </select>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.status}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-2 py-1 bg-primary-600 text-white rounded">Simpan</button>
                      <button onClick={() => setEditing(null)} className="px-2 py-1 border rounded dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Batal</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(row)} className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-200 rounded">Edit</button>
                      <button onClick={() => removeIndicator(row.id)} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 dark:text-red-200 rounded">Hapus</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
