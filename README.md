
# Laporan Kependudukan Bulanan — (Full HTML version)

Folder ini berisikan aplikasi web sederhana (HTML/CSS/JS) yang:
- Menyediakan form entri bulanan (RW/RT, penduduk, KK, kelahiran, kematian, migrasi, dsb).
- Menyimpan data ke Google Sheets via Google Apps Script (lihat `apps_script.gs`).
- Menampilkan dashboard ringkasan (semua RW/RT agregat) + grafik bulanan (Chart.js).
- Menyediakan tombol **Download Excel** yang mengonversi data ke .xlsx menggunakan SheetJS.

## Cara pakai singkat

1. Buat Google Sheet baru. Di sheet pertama, pada baris 1 isi header persis:
   `timestamp,bulanEntri,rw,rt,jumlahPenduduk,jumlahKK,jumlahKematian,jumlahKelahiran,pindahMasuk,pindahKeluar,pendudukMusiman`

2. Buka `Extensions → Apps Script`. Ganti kode dengan isi `apps_script.gs` dari folder ini. Simpan.
   Deploy → New deployment → pilih _Web app_. Set **Who has access** menjadi `Anyone` (atau `Anyone with link`).
   Salin **Web app URL**.

3. Edit `script.js` pada baris APPS_SCRIPT_URL dan ganti `'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'` dengan URL web app tadi.
   Alternatif: buka console browser dan jalankan:
   `localStorage.setItem('lapor_script_url', 'https://script.google.com/.../exec')`

4. Upload seluruh folder ke GitHub (atau langsung ke Vercel). Jika menggunakan Vercel, pilih framework `Other`/Static project.
   Pastikan file `index.html` berada di root repo.

5. Buka web, tes kirim form. Data akan muncul di Google Sheet. Di dashboard, klik Refresh untuk menampilkan data terbaru.
   Klik "Download Excel" untuk menyimpan seluruh data sebagai file `.xlsx`.

## Fitur tambahan yang bisa saya tambahkan (opsional)
- Filter per RW/RT di dashboard.
- Notifikasi email bila ada entri baru.
- Autentikasi sederhana untuk RW/RT agar hanya mereka yang dapat submit.
- Statistik keaktifan RW/RT (warna/ikon) berdasarkan frekuensi entri.
- Export ke PDF & cetak laporan per-bulan.
