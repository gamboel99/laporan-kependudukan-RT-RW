
// App v4 - precise fields, draft & final, export Excel, dashboard status, ringkasan chart
const STORAGE_KEY = "laporan_v4_entries";

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    showPage(btn.dataset.target);
  });
});
function showPage(id){ document.querySelectorAll('.page').forEach(p=>p.style.display='none'); document.getElementById(id).style.display='block'; if(id==='dashboard') renderStatus(); if(id==='ringkasan'){ populateYearFilter(); renderSummary(); } }

// Helpers storage
function loadEntries(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
function saveEntries(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// Update totals real-time
const pairs = [
  ['pendudukL','pendudukP','pendudukTotal'],
  ['lahirL','lahirP','lahirTotal'],
  ['matiL','matiP','matiTotal'],
  ['masukL','masukP','masukTotal'],
  ['keluarL','keluarP','keluarTotal'],
  ['musimanL','musimanP','musimanTotal']
];
pairs.forEach(([a,b,c])=>{
  const elA = document.getElementById(a);
  const elB = document.getElementById(b);
  [elA,elB].forEach(el=> el && el.addEventListener('input', ()=> updatePair(a,b,c)));
});
function updatePair(a,b,c){
  const vA = parseInt(document.getElementById(a).value)||0;
  const vB = parseInt(document.getElementById(b).value)||0;
  document.getElementById(c).innerText = vA + vB;
}

// Draft save & load
document.getElementById('btnSaveDraft').addEventListener('click', ()=>{
  const entry = readForm();
  entry.status='draft'; entry.updatedAt = new Date().toISOString();
  const key = entry.bulan + '|' + entry.rw + '|' + entry.rt;
  let all = loadEntries();
  const idx = all.findIndex(x=>x.key===key);
  entry.key = key;
  if(idx>=0) all[idx]=entry; else all.push(entry);
  saveEntries(all);
  showFormMsg('Draft tersimpan di perangkat.');
  renderFinalTable();
  renderStatus();
});

// Submit final
document.getElementById('btnSubmitFinal').addEventListener('click', ()=>{
  const entry = readForm();
  if(!entry.bulan || !entry.rw || !entry.rt){ alert('Isi Bulan, RW, dan RT terlebih dahulu.'); return; }
  entry.status='final'; entry.submittedAt = new Date().toISOString();
  entry.key = entry.bulan + '|' + entry.rw + '|' + entry.rt;
  let all = loadEntries();
  const idx = all.findIndex(x=>x.key===entry.key);
  if(idx>=0) all[idx]=entry; else all.push(entry);
  saveEntries(all);
  showFormMsg('Laporan final tersimpan.');
  renderFinalTable();
  renderStatus();
});

// Clear form
document.getElementById('btnClear').addEventListener('click', ()=>{
  document.getElementById('entryForm').reset();
  pairs.forEach(([a,b,c])=> document.getElementById(c).innerText='0');
});

function readForm(){
  return {
    bulan: document.getElementById('bulan').value || '',
    rw: (document.getElementById('rw').value || '').padStart(2,'0'),
    rt: (document.getElementById('rt').value || '').padStart(2,'0'),
    jumlahKK: parseInt(document.getElementById('jumlahKK').value)||0,
    pendudukL: parseInt(document.getElementById('pendudukL').value)||0,
    pendudukP: parseInt(document.getElementById('pendudukP').value)||0,
    lahirL: parseInt(document.getElementById('lahirL').value)||0,
    lahirP: parseInt(document.getElementById('lahirP').value)||0,
    matiL: parseInt(document.getElementById('matiL').value)||0,
    matiP: parseInt(document.getElementById('matiP').value)||0,
    masukL: parseInt(document.getElementById('masukL').value)||0,
    masukP: parseInt(document.getElementById('masukP').value)||0,
    keluarL: parseInt(document.getElementById('keluarL').value)||0,
    keluarP: parseInt(document.getElementById('keluarP').value)||0,
    musimanL: parseInt(document.getElementById('musimanL').value)||0,
    musimanP: parseInt(document.getElementById('musimanP').value)||0,
  };
}

// Render final table (only entries with status final)
function renderFinalTable(){
  const tbody = document.querySelector('#finalTable tbody');
  tbody.innerHTML='';
  const entries = loadEntries().filter(e=>e.status==='final');
  entries.sort((a,b)=> (b.submittedAt||'') - (a.submittedAt||''));
  entries.forEach(e=>{
    const tr = document.createElement('tr');
    const total = (e.pendudukL||0)+(e.pendudukP||0);
    tr.innerHTML = `<td>${e.bulan}</td><td>${e.rw}</td><td>${e.rt}</td><td>${e.jumlahKK}</td><td>${e.pendudukL}</td><td>${e.pendudukP}</td><td>${total}</td><td>Final</td>`;
    tbody.appendChild(tr);
  });
}

// Render dashboard status (which RW/RT completed this month)
function renderStatus(){
  const tbody = document.querySelector('#statusTable tbody');
  tbody.innerHTML='';
  const entries = loadEntries();
  const thisMonth = new Date().toISOString().slice(0,7);
  // build map of RW->RT
  const map = {};
  entries.forEach(e=>{
    if(!map[e.rw]) map[e.rw] = {};
    if(!map[e.rw][e.rt]) map[e.rw][e.rt] = {status:'Belum'};
    if(e.bulan===thisMonth && e.status==='final') map[e.rw][e.rt].status='Sudah';
  });
  // generate rows: show all RW/RT present in data or example up to 10 RW/RT
  for(let rw in map){
    for(let rt in map[rw]){
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${rw}</td><td>${rt}</td><td>${map[rw][rt].status==='Sudah' ? '✅ Sudah' : '❌ Belum'}</td>`;
      tbody.appendChild(tr);
    }
  }
}

// Ringkasan: year filter and chart
function populateYearFilter(){
  const sel = document.getElementById('filterYear');
  sel.innerHTML='';
  const now = new Date();
  const thisYear = now.getFullYear();
  for(let y=thisYear; y>=thisYear-4; y--){ const opt=document.createElement('option'); opt.value=String(y); opt.textContent=String(y); sel.appendChild(opt); }
  sel.value = String(thisYear);
}
document.getElementById('btnRefresh').addEventListener('click', renderSummary);

let chartInstance = null;
function renderSummary(){
  const year = document.getElementById('filterYear').value;
  const rwFilter = document.getElementById('filterRw').value.trim();
  const entries = loadEntries().filter(e=> e.bulan && e.bulan.startsWith(year));
  const filtered = rwFilter ? entries.filter(e=>e.rw===rwFilter.padStart(2,'0')) : entries;
  // aggregate per month totals L and P
  const months = Array.from({length:12}, (_,i)=> (i+1).toString().padStart(2,'0') );
  const labels = months.map(m=> `${year}-${m}`);
  const dataL=labels.map(l=> filtered.filter(e=>e.bulan===l).reduce((s,e)=>s+ (e.pendudukL||0),0));
  const dataP=labels.map(l=> filtered.filter(e=>e.bulan===l).reduce((s,e)=>s+ (e.pendudukP||0),0));
  // update chart
  const ctx = document.getElementById('genderChart').getContext('2d');
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, { type:'bar', data:{ labels: months, datasets:[ { label:'Laki-laki', data: dataL, backgroundColor:'#0b63d6' }, { label:'Perempuan', data: dataP, backgroundColor:'#00a676' } ] }, options:{ responsive:true, scales:{ x:{ stacked:false }, y:{ beginAtZero:true } } } });
  // update rekap table
  const tbody = document.querySelector('#rekapTable tbody'); tbody.innerHTML='';
  filtered.forEach(e=>{
    const tr=document.createElement('tr');
    const total=(e.pendudukL||0)+(e.pendudukP||0);
    tr.innerHTML = `<td>${e.bulan}</td><td>${e.rw}</td><td>${e.rt}</td><td>${e.jumlahKK}</td><td>${e.pendudukL}</td><td>${e.pendudukP}</td><td>${total}</td>`;
    tbody.appendChild(tr);
  });
}

// Excel export workbook per year (each sheet per RW maybe)
document.getElementById('btnDownloadExcel').addEventListener('click', ()=>{
  const year = document.getElementById('filterYear').value;
  const rwFilter = document.getElementById('filterRw').value.trim();
  const entries = loadEntries().filter(e=> e.bulan && e.bulan.startsWith(year));
  const filtered = rwFilter ? entries.filter(e=>e.rw===rwFilter.padStart(2,'0')) : entries;
  if(filtered.length===0){ alert('Tidak ada data untuk tahun/filternya.'); return; }
  // prepare workbook: one sheet "Laporan_<year>"
  const wsData = filtered.map(e=> ({
    Bulan: e.bulan, RW: e.rw, RT: e.rt, KK: e.jumlahKK,
    Penduduk_L: e.pendudukL, Penduduk_P: e.pendudukP, Penduduk_Total: (e.pendudukL||0)+(e.pendudukP||0),
    Lahir_L: e.lahirL, Lahir_P: e.lahirP, Lahir_Total: (e.lahirL||0)+(e.lahirP||0),
    Mati_L: e.matiL, Mati_P: e.matiP, Mati_Total: (e.matiL||0)+(e.matiP||0),
    Masuk_L: e.masukL, Masuk_P: e.masukP, Masuk_Total: (e.masukL||0)+(e.masukP||0),
    Keluar_L: e.keluarL, Keluar_P: e.keluarP, Keluar_Total: (e.keluarL||0)+(e.keluarP||0),
    Musiman_L: e.musimanL, Musiman_P: e.musimanP, Musiman_Total: (e.musimanL||0)+(e.musimanP||0),
    Status: e.status || ''
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_'+year);
  XLSX.writeFile(wb, 'Laporan_Kependudukan_'+year+'.xlsx');
});

// init on load
window.addEventListener('load', ()=>{
  renderFinalTable();
  renderStatus();
  populateYearFilter();
  renderSummary();
  // restore draft if exists for same month/rw/rt? leave manual load via draft saved in entries
});
