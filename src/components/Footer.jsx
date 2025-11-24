import React from 'react'

export default function Footer() {
  return (
    
    <footer className="bg-primary-900 text-white">
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h5 className="font-bold">GET IN TOUCH</h5>
          <i className="fa-solid fa-map-pin mr-2"></i><p className="text-sm mt-2">Jl. A. Yani No. 118, Ketintang, Gayungan, Surabaya, Jawa Timur</p>
          <i className="fa-solid fa-phone mr-2"></i><p className="text-sm">Telepon (031) 8280910 / Faximili (031) 8290423</p>
          <i className="fa-solid fa-at mr-2"></i><p className="text-sm mt-2">dinkes@jatimprov.go.id</p>
        </div>
        <div>
          <h5 className="font-bold">Links Cepat</h5>
          <ul className="mt-2 text-sm space-y-1">
            <li><a href="#akreditasi">Akreditasi</a></li>
            <li><a href="#indikator">Indikator</a></li>
            <li><a href="#dokumen">Dokumen</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold">Medsos Kami</h5>
          <div className="flex items-center space-x-3 mt-2">
            <a href="#" aria-label="twitter">Twitter</a>
            <a href="#" aria-label="facebook">Facebook</a>
            <a href="#" aria-label="instagram">Instagram</a>
            <a href="https://haniipp.my.id" aria-label="instagram">Credit Dev</a>
          </div>
        </div>
        <div>
          <h3 className="font-bold">Ikuti Kami di Saluran</h3>
          <div className="flex items-center space-x-2 mt-2">
            <button className='bg-primary-700 text-white px-4 py-2 rounded hover:bg-primary-600 '><a href="https://chat.whatsapp.com/FStqzv0F3O8ENbfwHK8jlI">Saluran WhatsApp</a></button>
          </div>
        </div>
      </div>
      <div className="bg-primary-800 text-center text-sm py-3">© 2025 Dinas Kesehatan Provinsi Jawa Timur — Built with Love ❤️</div>
    </footer>
  )
}
