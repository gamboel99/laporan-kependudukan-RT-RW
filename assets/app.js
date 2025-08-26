let dataEntries = JSON.parse(localStorage.getItem('entries')) || [];

function updateTotals() {
  const pairs = [
    ['pendudukL','pendudukP','pendudukTotal'],
    ['lahirL','lahirP','lahirTotal'],
    ['matiL','matiP','matiTotal'],
    ['masukL','masukP','masukTotal'],
    ['keluarL','keluarP','keluarTotal'],
    ['musimanL','musimanP','musimanTotal'],
  ];
  pairs.forEach(([idL,idP,idT])=>{
    let l = parseInt(document.getElementById(idL).value)||0;
    let p = parseInt(document.getElementById(idP).value)||0;
    document.getElementById(idT).innerText = l+p;
  });
}
document.querySelectorAll('input').forEach(el=> el.addEventListener('input', updateTotals));

function saveDraft(){
  let entry = getFormData();
  entry.status = 'draft';
  localStorage.setItem('draft', JSON.stringify(entry));
  alert('Draft tersimpan di perangkat ini.');
}
function submitFinal(){
  let entry = getFormData();
  entry.status = 'final';
  dataEntries.push(entry);
  localStorage.setItem('entries', JSON.stringify(dataEntries));
  localStorage.removeItem('draft');
  renderRiwayat();
  renderRingkasanDusun();
  downloadExcel();
}
function getFormData(){
  return {
    bulan: document.getElementById('bulan').value,
    rw: document.getElementById('rw').value,
    rt: document.getElementById('rt').value,
    pendudukL: +document.getElementById('pendudukL').value||0,
    pendudukP: +document.getElementById('pendudukP').value||0,
    kk: +document.getElementById('kk').value||0,
    lahirL: +document.getElementById('lahirL').value||0,
    lahirP: +document.getElementById('lahirP').value||0,
    matiL: +document.getElementById('matiL').value||0,
    matiP: +document.getElementById('matiP').value||0,
    masukL: +document.getElementById('masukL').value||0,
    masukP: +document.getElementById('masukP').value||0,
    keluarL: +document.getElementById('keluarL').value||0,
    keluarP: +document.getElementById('keluarP').value||0,
    musimanL: +document.getElementById('musimanL').value||0,
    musimanP: +document.getElementById('musimanP').value||0,
  };
}
function renderRiwayat(){
  let html = '<table border="1" cellpadding="5"><tr><th>Bulan</th><th>RW</th><th>RT</th><th>KK</th><th>Penduduk L</th><th>P</th><th>Total</th></tr>';
  dataEntries.forEach(e=>{
    html+=`<tr><td>${e.bulan}</td><td>${e.rw}</td><td>${e.rt}</td><td>${e.kk}</td><td>${e.pendudukL}</td><td>${e.pendudukP}</td><td>${e.pendudukL+e.pendudukP}</td></tr>`;
  });
  html+='</table>';
  document.getElementById('riwayatTable').innerHTML = html;
  renderChart();
}
function renderRingkasanDusun(){
  if(dataEntries.length==0){ return; }
  let grouped = {};
  dataEntries.forEach(e=>{
    if(!grouped[e.rw]) grouped[e.rw]={kk:0, rt: new Set()};
    grouped[e.rw].kk+=e.kk;
    grouped[e.rw].rt.add(e.rt);
  });
  let html = '<ul>';
  for(let rw in grouped){
    html+=`<li>RW ${rw}: RT ${Array.from(grouped[rw].rt).join(', ')} | Jumlah KK: ${grouped[rw].kk}</li>`;
  }
  html+='</ul>';
  document.getElementById('ringkasanDusun').innerHTML = html;
}
function downloadExcel(){
  let ws_data = [["Bulan","RW","RT","KK","Penduduk L","Penduduk P","Total"]];
  dataEntries.forEach(e=>{
    ws_data.push([e.bulan,e.rw,e.rt,e.kk,e.pendudukL,e.pendudukP,e.pendudukL+e.pendudukP]);
  });
  let wb = XLSX.utils.book_new();
  let ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, "laporan_kependudukan.xlsx");
}
function renderChart(){
  let ctx = document.getElementById('chart').getContext('2d');
  let labels = dataEntries.map(e=> e.bulan+' RW'+e.rw+'/RT'+e.rt);
  let dataL = dataEntries.map(e=> e.pendudukL);
  let dataP = dataEntries.map(e=> e.pendudukP);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {label:'Laki-Laki', data: dataL, backgroundColor:'#1e3c72'},
        {label:'Perempuan', data: dataP, backgroundColor:'#2a5298'}
      ]
    }
  });
}
window.onload=()=>{ renderRiwayat(); renderRingkasanDusun(); 
  let draft=localStorage.getItem('draft');
  if(draft){ Object.entries(JSON.parse(draft)).forEach(([k,v])=>{
    if(document.getElementById(k)) document.getElementById(k).value=v;
  }); updateTotals(); }
}
