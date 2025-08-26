// ================================
// Konfigurasi URL Google Apps Script
// ================================
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzJ0Tv8grsqZIyln7Y_-afSiRl4QMZjwNY5tujA29h6PUplWcEI2pJeOt3RgtX1X87O/exec";

// Kalau ada di localStorage gunakan itu, kalau tidak pakai default
const APPS_SCRIPT_URL = localStorage.getItem("laporanAppsScriptURL") || DEFAULT_APPS_SCRIPT_URL;

// ================================
// Utility
// ================================
const statusBox = document.getElementById("formStatus");
const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Tampilkan status ke user
function showStatus(msg, isError = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = isError ? "red" : "green";
}

// ================================
// FORM HANDLING
// ================================
const form = document.getElementById("laporanForm");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showStatus("⏳ Mengirim data...");

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.success) {
        showStatus("✅ Data berhasil dikirim!");
        form.reset();
        loadData(); // refresh data
      } else {
        showStatus("❌ Gagal menyimpan data ke Google Sheet", true);
      }
    } catch (err) {
      console.error(err);
      showStatus("❌ Terjadi kesalahan koneksi ke server", true);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      showStatus("Formulir telah direset");
    });
  }
}

// ================================
// LOAD DATA (Ringkasan + Tabel)
// ================================
const dataTable = document.querySelector("#dataTable tbody");
const statsGrid = document.getElementById("statsGrid");
let chart;

async function loadData() {
  if (!dataTable) return;
  showStatus("⏳ Memuat data...");

  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error("Format data tidak valid");

    // Bersihkan tabel
    dataTable.innerHTML = "";

    // Masukkan data
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.tanggal || ""}</td>
        <td>${row.bulanEntri || ""}</td>
        <td>${row.rw || ""}</td>
        <td>${row.rt || ""}</td>
        <td>${row.jumlahPenduduk || ""}</td>
        <td>${row.jumlahKK || ""}</td>
        <td>${row.jumlahKelahiran || ""}</td>
        <td>${row.jumlahKematian || ""}</td>
        <td>${row.pindahMasuk || ""}</td>
        <td>${row.pindahKeluar || ""}</td>
        <td>${row.pendudukMusiman || ""}</td>
      `;
      dataTable.appendChild(tr);
    });

    // Hitung ringkasan
    updateStats(rows);

    // Update chart
    updateChart(rows);

    showStatus("✅ Data berhasil dimuat");
  } catch (err) {
    console.error(err);
    showStatus("❌ Gagal memuat data. Pastikan URL Apps Script benar & bisa diakses.", true);
  }
}

// ================================
// RINGKASAN
// ================================
function updateStats(rows) {
  if (!statsGrid) return;
  statsGrid.innerHTML = "";

  const totalPenduduk = rows.reduce((sum, r) => sum + (parseInt(r.jumlahPenduduk) || 0), 0);
  const totalKK = rows.reduce((sum, r) => sum + (parseInt(r.jumlahKK) || 0), 0);
  const totalKelahiran = rows.reduce((sum, r) => sum + (parseInt(r.jumlahKelahiran) || 0), 0);
  const totalKematian = rows.reduce((sum, r) => sum + (parseInt(r.jumlahKematian) || 0), 0);

  const stats = [
    { label: "Total Penduduk", value: totalPenduduk },
    { label: "Total KK", value: totalKK },
    { label: "Kelahiran", value: totalKelahiran },
    { label: "Kematian", value: totalKematian },
  ];

  stats.forEach((s) => {
    const div = document.createElement("div");
    div.className = "stat-card";
    div.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
    statsGrid.appendChild(div);
  });
}

// ================================
// CHART
// ================================
function updateChart(rows) {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx) return;

  const grouped = {};
  rows.forEach((r) => {
    const bulan = r.bulanEntri || "N/A";
    if (!grouped[bulan]) grouped[bulan] = { penduduk: 0, kelahiran: 0, kematian: 0 };
    grouped[bulan].penduduk += parseInt(r.jumlahPenduduk) || 0;
    grouped[bulan].kelahiran += parseInt(r.jumlahKelahiran) || 0;
    grouped[bulan].kematian += parseInt(r.jumlahKematian) || 0;
  });

  const labels = Object.keys(grouped);
  const penduduk = labels.map((b) => grouped[b].penduduk);
  const kelahiran = labels.map((b) => grouped[b].kelahiran);
  const kematian = labels.map((b) => grouped[b].kematian);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Penduduk", data: penduduk, borderColor: "blue", fill: false },
        { label: "Kelahiran", data: kelahiran, borderColor: "green", fill: false },
        { label: "Kematian", data: kematian, borderColor: "red", fill: false },
      ],
    },
  });
}

// ================================
// BUTTONS
// ================================
const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) refreshBtn.addEventListener("click", loadData);

const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const table = document.getElementById("dataTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Data" });
    XLSX.writeFile(wb, "Laporan_Kependudukan.xlsx");
  });
}

// ================================
// INIT
// ================================
loadData();
