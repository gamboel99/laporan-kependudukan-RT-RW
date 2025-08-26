
// App v5 - final adjustments: auto-update dashboard and ringkasan; improved header/footer contrast
const STORAGE_KEY = "laporan_v5_entries";

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    showPage(btn.dataset.target);
  });
});
function showPage(id){ document.querySelectorAll('.page').forEach(p=>p.style.display='none'); document.getElementById(id).style.display='block'; if(id==='dashboard') renderStatus(); if(id==='ringkasan'){ populateYearFilter(); renderSummary(); } }

// Storage helpers
function loadEntries(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
function saveEntries(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// Update totals in form
const pairs = [['pendudukL','pendudukP','pendudukTotal'],['lahirL','lahirP','lahirTotal'],['matiL','matiP','matiTotal'],['masukL','masukP','masukTotal'],['keluarL','keluarP','keluarTotal'],['musimanL','musimanP','musimanTotal']];
pairs.forEach(([a,b,c])=>{ const A=document.getElementById(a); const B=document.getElementById(b); if(A && B){ [A,B].forEach(el=>el.addEventListener('input', ()=> updatePair(a,b,c))); }});
function updatePair(a,b,c){ const vA = parseInt(document.getElementById(a).value)||0; const vB = parseInt(document.getElementById(b).value)||0; document.getElementById(c).innerText = vA+vB; }

// Save draft
document.getElementById('btnSaveDraft').addEventListener('click', ()=>{
  const entry = readForm(); if(!entry.bulan||!entry.rw||!entry.rt){ alert('Isi Bulan, RW, dan RT minimal untuk menyimpan draft.'); return; }
  entry.status='draft'; entry.updatedAt = new Date().toISOString();
  entry.key = entry.bulan + '|' + entry.rw + '|' + entry.rt;
  let all = loadEntries(); const idx = all.findIndex(x=>x.key===entry.key);
  if(idx>=0) all[idx]=entry; else all.push(entry); saveEntries(all);
  showFormMsg('Draft disimpan.'); renderFinalTable(); renderStatus(); renderSummary();
});

// Submit final
document.getElementById('btnSubmitFinal').addEventListener('click', ()=>{
  const entry = readForm(); if(!entry.bulan||!entry.rw||!entry.rt){ alert('Lengkapi Bulan, RW, RT.'); return; }
  entry.status='final'; entry.submittedAt = new Date().toISOString(); entry.key = entry.bulan + '|' + entry.rw + '|' + entry.rt;
  let all = loadEntries(); const idx = all.findIndex(x=>x.key===entry.key);
  if(idx>=0) all[idx]=entry; else all.push(entry); saveEntries(all);
  showFormMsg('Laporan final tersimpan.'); renderFinalTable(); renderStatus(); renderSummary();
});

// Clear form
document.getElementById('btnClear').addEventListener('click', ()=>{ document.getElementById('entryForm').reset(); pairs.forEach(([a,b,c])=> document.getElementById(c).innerText='0'); });

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

// Render final table (auto-updated)
function renderFinalTable(){
  const tbody = document.querySelector('#finalTable tbody'); tbody.innerHTML='';
  const entries = loadEntries().filter(e=>e.status==='final');
  entries.sort((a,b)=> (b.submittedAt||'') - (a.submittedAt||''));
  entries.forEach(e=>{
    const tr = document.createElement('tr'); const total = (e.pendudukL||0)+(e.pendudukP||0);
    tr.innerHTML = `<td>${e.bulan}</td><td>${e.rw}</td><td>${e.rt}</td><td>${e.jumlahKK}</td><td>${e.pendudukL}</td><td>${e.pendudukP}</td><td>${total}</td><td>Final</td>`;
    tbody.appendChild(tr);
  });
  // update dashboard summary quick values
  updateQuickSummary();
}

// Dashboard status render (auto-updated)
document.getElementById('statusRefresh').addEventListener('click', renderStatus);
function renderStatus(){
  const tbody = document.querySelector('#statusTable tbody'); tbody.innerHTML='';
  const month = document.getElementById('statusMonth').value || new Date().toISOString().slice(0,7);
  const entries = loadEntries();
  // build map RW->RT status
  const map = {};
  entries.forEach(e=>{
    if(!map[e.rw]) map[e.rw]={};
    if(!map[e.rw][e.rt]) map[e.rw][e.rt] = 'Belum';
    if(e.bulan===month && e.status==='final') map[e.rw][e.rt] = 'Sudah';
  });
  // render rows sorted
  Object.keys(map).sort().forEach(rw=>{
    Object.keys(map[rw]).sort().forEach(rt=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${rw}</td><td>${rt}</td><td>${map[rw][rt]==='Sudah' ? '✅ Sudah' : '❌ Belum'}</td>`;
      tbody.appendChild(tr);
    });
  });
}

// Quick summary values on dashboard
function updateQuickSummary(){
  const entries = loadEntries().filter(e=>e.status==='final');
  const sumKK = entries.reduce((s,e)=>s+(e.jumlahKK||0),0);
  const sumPenduduk = entries.reduce((s,e)=>s+(e.pendudukL||0)+(e.pendudukP||0),0);
  const rws = Array.from(new Set(entries.map(e=>e.rw)));
  document.getElementById('sumKK').innerText = sumKK;
  document.getElementById('sumPenduduk').innerText = sumPenduduk;
  document.getElementById('countRW').innerText = rws.length;
}

// Ringkasan: populate years and render chart + table
function populateYearFilter(){
  const sel = document.getElementById('filterYear'); sel.innerHTML='';
  const now = new Date(); const thisYear = now.getFullYear();
  for(let y=thisYear; y>=thisYear-5; y--){ const opt = document.createElement('option'); opt.value=String(y); opt.textContent=String(y); sel.appendChild(opt); }
  sel.value = String(thisYear);
}
document.getElementById('btnRefresh').addEventListener('click', renderSummary);

let chartInstance = null;
function renderSummary(){
  const year = document.getElementById('filterYear').value;
  const rwFilter = (document.getElementById('filterRw').value || '').trim();
  const entries = loadEntries().filter(e=> e.bulan && e.bulan.startsWith(year) && e.status==='final');
  const filtered = rwFilter ? entries.filter(e=>e.rw===rwFilter.padStart(2,'0')) : entries;
  // months labels and aggregated L/P per month
  const months = Array.from({length:12}, (_,i)=> (i+1).toString().padStart(2,'0') );
  const labels = months.map(m=> `${m}`);
  const dataL = months.map(m=> filtered.filter(e=>e.bulan===`${year}-${m}`).reduce((s,e)=>s+(e.pendudukL||0),0));
  const dataP = months.map(m=> filtered.filter(e=>e.bulan===`${year}-${m}`).reduce((s,e)=>s+(e.pendudukP||0),0));
  // chart update
  const ctx = document.getElementById('genderChart').getContext('2d');
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, { type:'bar', data:{ labels, datasets:[ { label:'Laki-laki', data: dataL, backgroundColor:'#0b63d6' }, { label:'Perempuan', data: dataP, backgroundColor:'#00a676' } ] }, options:{ responsive:true, scales:{ y:{ beginAtZero:true } } } });
  // update rekap table rows
  const tbody = document.querySelector('#rekapTable tbody'); tbody.innerHTML='';
  filtered.forEach(e=>{
    const tr = document.createElement('tr'); const total=(e.pendudukL||0)+(e.pendudukP||0);
    tr.innerHTML = `<td>${e.bulan}</td><td>${e.rw}</td><td>${e.rt}</td><td>${e.jumlahKK}</td><td>${e.pendudukL}</td><td>${e.pendudukP}</td><td>${total}</td>`;
    tbody.appendChild(tr);
  });
}

// Excel export workbook: Summary sheet + Details sheet
document.getElementById('btnDownloadExcel').addEventListener('click', ()=>{
  const year = document.getElementById('filterYear').value;
  const rwFilter = (document.getElementById('filterRw').value || '').trim();
  const entries = loadEntries().filter(e=> e.bulan && e.bulan.startsWith(year) && e.status==='final');
  const filtered = rwFilter ? entries.filter(e=>e.rw===rwFilter.padStart(2,'0')) : entries;
  if(filtered.length===0){ alert('Tidak ada data untuk tahun/filternya.'); return; }
  // Details sheet rows
  const details = filtered.map(e=> ({
    Bulan: e.bulan, RW: e.rw, RT: e.rt, KK: e.jumlahKK,
    Penduduk_L: e.pendudukL, Penduduk_P: e.pendudukP, Penduduk_Total: (e.pendudukL||0)+(e.pendudukP||0),
    Lahir_L: e.lahirL, Lahir_P: e.lahirP, Lahir_Total: (e.lahirL||0)+(e.lahirP||0),
    Mati_L: e.matiL, Mati_P: e.matiP, Mati_Total: (e.matiL||0)+(e.matiP||0),
    Masuk_L: e.masukL, Masuk_P: e.masukP, Masuk_Total: (e.masukL||0)+(e.masukP||0),
    Keluar_L: e.keluarL, Keluar_P: e.keluarP, Keluar_Total: (e.keluarL||0)+(e.keluarP||0),
    Musiman_L: e.musimanL, Musiman_P: e.musimanP, Musiman_Total: (e.musimanL||0)+(e.musimanP||0),
    Status: e.status || ''
  }));
  // Summary sheet: aggregated per RW and per month totals
  const summaryMap = {};
  filtered.forEach(e=>{
    const key = e.rw;
    if(!summaryMap[key]) summaryMap[key] = {RW:key, KK:0, Penduduk_L:0, Penduduk_P:0, Total:0};
    summaryMap[key].KK += e.jumlahKK||0;
    summaryMap[key].Penduduk_L += e.pendudukL||0;
    summaryMap[key].Penduduk_P += e.pendudukP||0;
    summaryMap[key].Total += (e.pendudukL||0)+(e.pendudukP||0);
  });
  const summary = Object.values(summaryMap);
  // build workbook
  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  const wsDetails = XLSX.utils.json_to_sheet(details);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary_RW');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');
  XLSX.writeFile(wb, `Laporan_Kependudukan_${year}.xlsx`);
});

// init on load
window.addEventListener('load', ()=>{ renderFinalTable(); renderStatus(); populateYearFilter(); renderSummary(); // set statusMonth default to current month
  document.getElementById('statusMonth').value = new Date().toISOString().slice(0,7);
});
function showFormMsg(msg){ const el = document.getElementById('formMsg'); el.innerText = msg; setTimeout(()=>el.innerText='',3000); }
