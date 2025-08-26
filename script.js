// ====== Konfigurasi URL Google Apps Script ======
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzJ0Tv8grsqZIyln7Y_-afSiRl4QMZjwNY5tujA29h6PUplWcEI2pJeOt3RgtX1X87O/exec";

// Jalankan setelah halaman selesai dimuat
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("laporanForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Ambil data dari form sesuai name/id input
      const data = {
        bulan: form.bulan.value,
        rw: form.rw.value,
        rt: form.rt.value,
        jumlahPenduduk: form.jumlah_penduduk.value,
        jumlahKK: form.jumlah_kk.value,
        jumlahKematian: form.jumlah_kematian.value,
        jumlahKelahiran: form.jumlah_kelahiran.value,
        pindahMasuk: form.pindah_masuk.value,
        pindahKeluar: form.pindah_keluar.value,
        pendudukMusiman: form.penduduk_musiman.value,
      };

      // Kirim data ke Google Apps Script (POST JSON)
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success") {
            alert("✅ Data berhasil dikirim ke Spreadsheet!");
            form.reset();
          } else {
            alert("⚠️ Gagal: " + res.message);
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("❌ Gagal menghubungi server. Periksa koneksi atau Apps Script.");
        });
    });
  }
});
