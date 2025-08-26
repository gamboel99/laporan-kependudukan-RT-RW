// Simple localStorage-based app for Laporan Kependudukan Bulanan
const STORAGE_KEY = "laporan_kependudukan_v1";

// Helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function loadData(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function saveData(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Navigation
$$(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $$(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    showPage(btn.dataset.target);
  });
});
function showPage(id){
  $$(".page").forEach(p=>p.style.display = "none");
  const el = $("#"+id);
  if(el) el.style.display = "block";
  if(id === "ringkasan") renderSummary();
}
showPage('dashboard');

// Form logic
const form = document.getElementById("entryForm");
const fields = ["bulan","rw","rt","jumlahPenduduk","jumlahKK","jumlahKematian","jumlahKelahiran","pindahMasuk","pindahKeluar","musiman","pengirimEmail"];
function readForm(){
  const obj = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    obj[f] = el ? el.value : "";
  });
  return obj;
}
function populateForm(obj){
  fields.forEach(f => {
    const el = document.getElementById(f);
    if(el && obj[f] !== undefined) el.value = obj[f];
  });
}

// Draft and final statuses
function saveDraft(){
  const data = readForm();
  if(!data.bulan || !data.rw || !data.rt){
    showMsg("Isi Bulan, RW, dan RT minimal untuk menyimpan draft.", true);
    return;
  }
  const all = loadData();
  // id by bulan+rw+rt to allow continuing same entry
  const idKey = data.bulan + "|" + data.rw + "|" + data.rt;
  const existingIndex = all.findIndex(x=>x.id === idKey && x.status !== 'deleted');
  const item = Object.assign({}, data, { id: idKey, status: "draft", updatedAt: new Date().toISOString() });
  if(existingIndex >= 0){
    all[existingIndex] = Object.assign(all[existingIndex], item);
  } else {
    item.createdAt = new Date().toISOString();
    all.push(item);
  }
  saveData(all);
  renderDrafts();
  showMsg("Draft disimpan di perangkat ini.");
}

function submitFinal(){
  const data = readForm();
  if(!data.bulan || !data.rw || !data.rt){
    showMsg("Lengkapi Bulan, RW, RT sebelum kirim final.", true);
    return;
  }
  const all = loadData();
  const idKey = data.bulan + "|" + data.rw + "|" + data.rt;
  const existingIndex = all.findIndex(x=>x.id === idKey && x.status !== 'deleted');
  const item = Object.assign({}, data, { id: idKey, status: "final", updatedAt: new Date().toISOString(), submittedAt: new Date().toISOString() });
  if(existingIndex >= 0){
    all[existingIndex] = Object.assign(all[existingIndex], item);
  } else {
    item.createdAt = new Date().toISOString();
    all.push(item);
  }
  saveData(all);
  renderDrafts();
  showMsg("Laporan dikirim final. Silakan unduh Excel jika ingin mengarsip.");
}

function resetForm(){
  form.reset();
  showMsg("Form di-reset.", false);
}

$("#btnSaveDraft").addEventListener("click", (e)=>{ e.preventDefault(); saveDraft(); });
$("#btnSubmitFinal").addEventListener("click", (e)=>{ e.preventDefault(); submitFinal(); });
$("#btnReset").addEventListener("click", (e)=>{ e.preventDefault(); resetForm(); });

function showMsg(msg, isError=false){
  const el = $("#formMsg");
  el.textContent = msg;
  el.style.color = isError ? "#b32d2e" : "#2b6f2f";
  setTimeout(()=>{ el.textContent = ""; }, 4000);
}

// Draft list UI
function renderDrafts(){
  const all = loadData();
  const drafts = all.filter(x => x.status === "draft");
  const div = $("#draftList");
  if(!drafts.length){ div.textContent = "Tidak ada draft."; return; }
  div.innerHTML = "";
  drafts.forEach(d=>{
    const wrap = document.createElement("div");
    wrap.className = "draft-item";
    wrap.innerHTML = `<strong>${d.bulan}</strong> — RW ${d.rw} / RT ${d.rt} <div class="muted small">Terakhir: ${new Date(d.updatedAt).toLocaleString()}</div>`;
    const btns = document.createElement("div");
    btns.style.marginTop = "6px";
    const btnLoad = document.createElement("button");
    btnLoad.className = "btn small secondary";
    btnLoad.textContent = "Lanjutkan";
    btnLoad.addEventListener("click", ()=>{ populateForm(d); showMsg("Draft dimuat ke form."); });
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn small ghost";
    btnDelete.textContent = "Hapus";
    btnDelete.addEventListener("click", ()=>{ deleteDraft(d.id); });
    btns.appendChild(btnLoad); btns.appendChild(btnDelete);
    wrap.appendChild(btns);
    div.appendChild(wrap);
  });
}

function deleteDraft(id){
  const all = loadData();
  const idx = all.findIndex(x=>x.id===id);
  if(idx>=0){ all[idx].status = 'deleted'; saveData(all); renderDrafts(); showMsg("Draft dihapus."); }
}

// Ringkasan & history
function populateYearFilter(){
  const all = loadData();
  const years = Array.from(new Set(all.map(x=>x.bulan ? x.bulan.slice(0,4) : new Date().getFullYear().toString()))).sort().reverse();
  const sel = $("#filterYear");
  sel.innerHTML = "";
  const thisYear = new Date().getFullYear().toString();
  if(!years.includes(thisYear)) years.unshift(thisYear);
  years.forEach(y=>{
    const opt = document.createElement("option");
    opt.value = y; opt.textContent = y;
    sel.appendChild(opt);
  });
  sel.value = thisYear;
}
function renderSummary(){
  populateYearFilter();
  const year = $("#filterYear").value || new Date().getFullYear().toString();
  const rwFilter = $("#filterRw").value.trim();
  const all = loadData().filter(x => x.status !== 'deleted');
  // filter by year
  const byYear = all.filter(x => x.bulan && x.bulan.startsWith(year));
  const filtered = rwFilter ? byYear.filter(x=>x.rw===rwFilter) : byYear;
  // aggregate
  let sumPenduduk=0, sumKK=0, sumKelahiran=0, sumKematian=0;
  filtered.forEach(x=>{
    sumPenduduk += Number(x.jumlahPenduduk||0);
    sumKK += Number(x.jumlahKK||0);
    sumKelahiran += Number(x.jumlahKelahiran||0);
    sumKematian += Number(x.jumlahKematian||0);
  });
  $("#sumPenduduk").textContent = sumPenduduk;
  $("#sumKK").textContent = sumKK;
  $("#sumKelahiran").textContent = sumKelahiran;

  // update history table
  const tbody = $("#historyBody");
  tbody.innerHTML = "";
  filtered.sort((a,b)=> (b.updatedAt||"") - (a.updatedAt||""));
  filtered.forEach(x=>{
    const tr = document.createElement("tr");
    const tanggal = x.submittedAt ? new Date(x.submittedAt).toLocaleString() : (x.updatedAt? new Date(x.updatedAt).toLocaleString() : "");
    tr.innerHTML = `<td>${tanggal}</td><td>${x.bulan}</td><td>${x.rw}</td><td>${x.rt}</td><td>${x.jumlahPenduduk||0}</td><td>${x.jumlahKK||0}</td><td>${x.jumlahKelahiran||0}</td><td>${x.jumlahKematian||0}</td><td>${x.status}</td>`;
    tbody.appendChild(tr);
  });

  // chart: monthly totals for penduduk (by month)
  const months = Array.from({length:12}, (_,i)=>{ const m = i+1; return (m<10? '0'+m : ''+m); });
  const labels = months.map(m => year + '-' + m);
  const dataMap = {};
  filtered.forEach(x=>{ dataMap[x.bulan] = (dataMap[x.bulan]||0) + Number(x.jumlahPenduduk||0); });
  const dataArr = labels.map(l => dataMap[l]||0);

  renderChart(labels.map(l=>l.slice(5)), dataArr);
}

let chartInstance = null;
function renderChart(labels, dataArr){
  const ctx = document.getElementById('summaryChart').getContext('2d');
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Penduduk per bulan', data: dataArr, backgroundColor: 'rgba(11,99,214,0.7)' }] },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
}

// Download Excel per year
function downloadExcelYear(){
  const year = $("#filterYear").value || new Date().getFullYear().toString();
  const rwFilter = $("#filterRw").value.trim();
  const all = loadData().filter(x => x.status !== 'deleted');
  const rows = all.filter(x => x.bulan && x.bulan.startsWith(year));
  const filtered = rwFilter ? rows.filter(x=>x.rw===rwFilter) : rows;
  if(!filtered.length){ alert("Tidak ada data untuk tahun terpilih."); return; }
  // prepare sheet data
  const wsData = filtered.map(r => ({
    Bulan: r.bulan,
    RW: r.rw,
    RT: r.rt,
    Penduduk: r.jumlahPenduduk || 0,
    KK: r.jumlahKK || 0,
    Kelahiran: r.jumlahKelahiran || 0,
    Kematian: r.jumlahKematian || 0,
    PindahMasuk: r.pindahMasuk || 0,
    PindahKeluar: r.pindahKeluar || 0,
    Musiman: r.musiman || 0,
    Status: r.status,
    PengirimEmail: r.pengirimEmail || ""
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_'+year);
  const fileName = `Laporan_Kependudukan_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Init
document.getElementById("btnRefresh").addEventListener("click", renderSummary);
document.getElementById("btnDownloadExcel").addEventListener("click", downloadExcelYear);

renderDrafts();
populateYearFilter();
renderSummary(); // initial

// restore draft if exists for today's month? try to pre-fill if single draft for same RW/RT
(function tryRestorePrevious(){
  // noop for now, form user will Load draft manually
})();
