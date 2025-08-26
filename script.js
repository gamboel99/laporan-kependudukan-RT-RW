// ===== KONFIGURASI =====
const SCRIPT_URL = "PASTE_URL_APPS_SCRIPT_KAMU_DI_SINI";

// ===== ELEMENTS =====
const form = document.getElementById("laporanForm");
const statusEl = document.getElementById("formStatus");
const resetBtn = document.getElementById("resetBtn");
const refreshBtn = document.getElementById("refreshBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statsGrid = document.getElementById("statsGrid");
const dataTable = document.querySelector("#dataTable tbody");
const yearEl = document.getElementById("year");
const ctx = document.getElementById("monthlyChart").getContext("2d");

yearEl.textContent = new Date().getFullYear();

// ===== FORM SUBMIT =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Mengirim data...";
  
  const formData = new FormData(form);
  const payload = {
    bulan: formData.get("bulanEntri"),
    rw: formData.get("rw"),
    rt: formData.get("rt"),
    jumlahPenduduk: formData.get("jumlahPenduduk"),
    jumlahKK: formData.get("jumlahKK"),
    jumlahKematian: formData.get("jumlahKematian"),
    jumlahKelahiran: formData.get("jumlahKelahiran"),
    pindahMasuk: formData.get("pindahMasuk"),
    pindahKeluar: formData.get("pindahKeluar"),
    pendudukMusiman: formData.get("pendudukMusiman"),
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.status === "success") {
      statusEl.textContent = "✅ Data berhasil disimpan";
      form.reset();
      loadData();
    } else {
      statusEl.textContent = "⚠️ Gagal menyimpan data";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Terjadi kesalahan koneksi";
  }
});

// ===== RESET FORM =====
resetBtn.addEventListener("click", () => {
  form.reset();
  statusEl.textContent = "";
});

// ===== FETCH DATA & UPDATE DASHBOARD =====
async function loadData() {
  try {
    const res = await fetch(SCRIPT_URL);
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error("Format data salah");

    // ---- update stats ----
    const totals = {
      penduduk: 0,
      kk: 0,
      kelahiran: 0,
      kematian: 0,
      masuk: 0,
      keluar: 0,
      musiman: 0,
    };

    rows.forEach(r => {
      totals.penduduk += Number(r["jumlahPenduduk"] || 0);
      totals.kk += Number(r["jumlahKK"] || 0);
      totals.kelahiran += Number(r["jumlahKelahiran"] || 0);
      totals.kematian += Number(r["jumlahKematian"] || 0);
      totals.masuk += Number(r["pindahMasuk"] || 0);
      totals.keluar += Number(r["pindahKeluar"] || 0);
      totals.musiman += Number(r["pendudukMusiman"] || 0);
    });

    statsGrid.innerHTML = `
      <div class="stat"><b>${totals.penduduk}</b><span>Penduduk</span></div>
      <div class="stat"><b>${totals.kk}</b><span>Kepala Keluarga</span></div>
      <div class="stat"><b>${totals.kelahiran}</b><span>Kelahiran</span></div>
      <div class="stat"><b>${totals.kematian}</b><span>Kematian</span></div>
      <div class="stat"><b>${totals.masuk}</b><span>Pindah Masuk</span></div>
      <div class="stat"><b>${totals.keluar}</b><span>Pindah Keluar</span></div>
      <div class="stat"><b>${totals.musiman}</b><span>Musiman</span></div>
    `;

    // ---- update table ----
    dataTable.innerHTML = "";
    rows.reverse().forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r["Timestamp"] || ""}</td>
        <td>${r["bulan"] || ""}</td>
        <td>${r["rw"] || ""}</td>
        <td>${r["rt"] || ""}</td>
        <td>${r["jumlahPenduduk"] || 0}</td>
        <td>${r["jumlahKK"] || 0}</td>
        <td>${r["jumlahKelahiran"] || 0}</td>
        <td>${r["jumlahKematian"] || 0}</td>
        <td>${r["pindahMasuk"] || 0}</td>
        <td>${r["pindahKeluar"] || 0}</td>
        <td>${r["pendudukMusiman"] || 0}</td>
      `;
      dataTable.appendChild(tr);
    });

    // ---- update chart ----
    updateChart(rows);

  } catch (err) {
    console.error("Gagal load data:", err);
    statusEl.textContent = "❌ Gagal memuat data";
  }
}

// ===== CHART =====
let chart;
function updateChart(rows) {
  const labels = rows.map(r => r["bulan"]);
  const dataPenduduk = rows.map(r => Number(r["jumlahPenduduk"] || 0));

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Jumlah Penduduk",
        data: dataPenduduk,
        fill: false,
        borderColor: "blue",
        tension: 0.1,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// ===== DOWNLOAD EXCEL =====
downloadBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(SCRIPT_URL);
    const rows = await res.json();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "Laporan_Kependudukan.xlsx");
  } catch (err) {
    alert("Gagal download data");
  }
});

// ===== REFRESH =====
refreshBtn.addEventListener("click", loadData);

// ===== AUTO LOAD =====
loadData();
