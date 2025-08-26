// ====== Konfigurasi: Ganti URL ini dengan Web App URL Google Apps Script Anda ======
const APPS_SCRIPT_URL = localStorage.getItem('lapor_script_url') || 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
// Untuk konfigurasi cepat: buka console dan jalankan:
// localStorage.setItem('lapor_script_url', 'https://script.google.com/.../exec')

const form = document.getElementById('laporanForm');
const statusEl = document.getElementById('formStatus');
const refreshBtn = document.getElementById('refreshBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statsGrid = document.getElementById('statsGrid');
const dataTableBody = document.querySelector('#dataTable tbody');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

let allData = []; // cache

async function postData(payload){
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    throw err;
  }
}

async function fetchAll(){
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=getAll');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('fetchAll err', err);
    return [];
  }
}

function showStatus(msg, ok=true){
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#066' : '#a00';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  showStatus('Mengirim...');
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());
  obj.timestamp = new Date().toISOString();
  try {
    const res = await postData(obj);
    if(res && res.ok){
      showStatus('Laporan berhasil dikirim.', true);
      form.reset();
      await loadAndRender();
    } else {
      showStatus('Server menolak data: ' + (res && res.message ? res.message : JSON.stringify(res)), false);
    }
  } catch (err) {
    showStatus('Gagal mengirim: ' + err.message, false);
  } finally {
    submitBtn.disabled = false;
  }
});

resetBtn.addEventListener('click', ()=>{ form.reset(); showStatus('Form disetel ulang.', true); });

refreshBtn.addEventListener('click', ()=> loadAndRender());

downloadBtn.addEventListener('click', ()=> {
  if(!allData || allData.length===0){ alert('Tidak ada data untuk diunduh.'); return; }
  // Konversi ke worksheet
  const ws = XLSX.utils.json_to_sheet(allData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
  XLSX.writeFile(wb, 'laporan-kependudukan.xlsx');
});

function groupByMonth(arr){
  const map = {};
  arr.forEach(r => {
    const m = r.bulanEntri || r.month || '';
    if(!map[m]) map[m] = {penduduk:0, kk:0, kelahiran:0, kematian:0, masuk:0, keluar:0, count:0};
    map[m].penduduk += Number(r.jumlahPenduduk||0);
    map[m].kk += Number(r.jumlahKK||0);
    map[m].kelahiran += Number(r.jumlahKelahiran||0);
    map[m].kematian += Number(r.jumlahKematian||0);
    map[m].masuk += Number(r.pindahMasuk||0);
    map[m].keluar += Number(r.pindahKeluar||0);
    map[m].count += 1;
  });
  return map;
}

function renderStats(data){
  // aggregate totals
  const totals = data.reduce((acc, r) => {
    acc.penduduk += Number(r.jumlahPenduduk||0);
    acc.kk += Number(r.jumlahKK||0);
    acc.kelahiran += Number(r.jumlahKelahiran||0);
    acc.kematian += Number(r.jumlahKematian||0);
    acc.masuk += Number(r.pindahMasuk||0);
    acc.keluar += Number(r.pindahKeluar||0);
    return acc;
  }, {penduduk:0, kk:0, kelahiran:0, kematian:0, masuk:0, keluar:0});

  statsGrid.innerHTML = `
    <div class="stat"><h4>Total Penduduk</h4><p>${totals.penduduk}</p></div>
    <div class="stat"><h4>Total KK</h4><p>${totals.kk}</p></div>
    <div class="stat"><h4>Kelahiran</h4><p>${totals.kelahiran}</p></div>
    <div class="stat"><h4>Kematian</h4><p>${totals.kematian}</p></div>
    <div class="stat"><h4>Pindah Masuk</h4><p>${totals.masuk}</p></div>
    <div class="stat"><h4>Pindah Keluar</h4><p>${totals.keluar}</p></div>
  `;
}

let chartInstance = null;
function renderChart(data){
  const map = groupByMonth(data);
  const months = Object.keys(map).sort();
  const penduduk = months.map(m => map[m].penduduk);
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type:'bar',
    data:{
      labels: months,
      datasets:[{label:'Total Penduduk', data: penduduk}]
    },
    options:{responsive:true, plugins:{legend:{display:false}}}
  });
}

function renderTable(data){
  dataTableBody.innerHTML = '';
  // show newest first
  const arr = data.slice().reverse();
  arr.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(r.timestamp||'').toLocaleString()}</td>
      <td>${r.bulanEntri||''}</td>
      <td>${r.rw||''}</td>
      <td>${r.rt||''}</td>
      <td>${r.jumlahPenduduk||0}</td>
      <td>${r.jumlahKK||0}</td>
      <td>${r.jumlahKelahiran||0}</td>
      <td>${r.jumlahKematian||0}</td>
      <td>${r.pindahMasuk||0}</td>
      <td>${r.pindahKeluar||0}</td>
      <td>${r.pendudukMusiman||0}</td>
    `;
    dataTableBody.appendChild(tr);
  });
}

async function loadAndRender(){
  showStatus('Memuat data...');
  const data = await fetchAll();
  allData = Array.isArray(data) ? data : [];
  renderStats(allData);
  renderChart(allData);
  renderTable(allData);
  showStatus('Data diperbarui.', true);
}

// initial load
loadAndRender();
window.loadAndRender = loadAndRender; // debug hook
