README - Aplikasi Laporan Kependudukan Bulanan (offline localStorage)

Isi folder:
- index.html : Halaman utama (4 menu: Dashboard, Form Entri, Ringkasan & Riwayat, Tentang).
- assets/style.css : Styling modern dan responsif sederhana.
- assets/app.js : Logika aplikasi (menyimpan draft, submit final, ringkasan, export Excel).
- README.txt : Berkas ini.

Cara pakai (sederhana):
1. Upload seluruh folder ke hosting statis (mis. GitHub Pages / Vercel) atau buka file index.html langsung di browser.
2. RT/RW mengisi form di menu 'Form Entri'. Gunakan tombol 'Simpan Draft' untuk menyimpan sementara di perangkat yang sama.
3. Jika laporan sudah lengkap, klik 'Kirim Final (Submit Final)'. Data status 'final' bisa diunduh lewat menu 'Ringkasan' -> 'Download Excel (tahun)'.
4. File Excel yang dihasilkan berupa workbook dengan nama 'Laporan_Kependudukan_<tahun>.xlsx' berisi sheet 'Laporan_<tahun>'.
5. Kirim file tersebut via WhatsApp ke admin desa.

Catatan teknis & batasan:
- Semua data disimpan <strong>secara lokal di perangkat</strong> (localStorage). Jadi draft hanya bisa di-restore di perangkat yang sama dan browser yang sama.
- Jika ingin multi-user (RT input lewat HP masing-masing dan data terkumpul di server), perlu tambahan backend (bisa saya bantu).
- Aplikasi menggunakan SheetJS (XLSX) via CDN untuk generate Excel, serta Chart.js untuk grafik.
- Untuk penggunaan oleh pengguna lansia: disarankan memasang shortcut ke halaman web di layar utama HP atau komputer agar mudah diakses.

Butuh tambahan fitur?
- Sinkronisasi ke server / central backup
- Login sederhana (OTP)
- PDF otomatis & kirim WA otomatis via API (butuh backend)
Jika ingin saya tambahkan fitur tersebut, saya bantu buatkan versi berikutnya.

-- Selesai --
