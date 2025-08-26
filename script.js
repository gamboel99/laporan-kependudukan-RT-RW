// ===============================
// Konfigurasi URL Google Apps Script
// ===============================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3-0sv7Y_8Nsr8EPMkQvaChjxTPryI3FIMSOf3CbOHB1CgT0T8Dea_En_xBqtb-4Wb/exec";

// ===============================
// Fungsi untuk submit form
// ===============================
async function submitForm(event) {
  event.preventDefault();

  // Ambil data dari form
  const form = event.target;
  const data = {
    rw: form.rw.value,
    rt: form.rt.value,
    jumlahPenduduk: form.jumlahPenduduk.value,
    jumlahKK: form.jumlahKK.value,
    jumlahKematian: form.jumlahKematian.value,
    jumlahKelahiran: form.jumlahKelahiran.value,
    pindahMasuk: form.pindahMasuk.value,
    pindahKeluar: form.pindahKeluar.value,
    pendudukMusiman: form.pendudukMusiman.value
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Data berhasil disimpan ke Spreadsheet!");
      form.reset();
    } else {
      alert("❌ Gagal menyimpan data: " + result.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Terjadi kesalahan koneksi ke server!");
  }
}

// ===============================
// Pasang event listener ke form
// Pastikan <form> Anda punya id="dataForm"
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dataForm");
  if (form) {
    form.addEventListener("submit", submitForm);
  }
});
