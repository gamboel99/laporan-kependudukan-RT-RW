// Google Apps Script: simpan sebagai Code.gs di project Apps Script yang terhubung ke Google Sheet
// Pastikan Sheet pertama memiliki header di row pertama:
// timestamp,bulanEntri,rw,rt,jumlahPenduduk,jumlahKK,jumlahKematian,jumlahKelahiran,pindahMasuk,pindahKeluar,pendudukMusiman

function doPost(e){
  try{
    var body = typeof e.postData === 'object' ? JSON.parse(e.postData.contents) : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheets()[0];
    var row = [
      body.timestamp || new Date().toISOString(),
      body.bulanEntri || '',
      body.rw || '',
      body.rt || '',
      Number(body.jumlahPenduduk || 0),
      Number(body.jumlahKK || 0),
      Number(body.jumlahKematian || 0),
      Number(body.jumlahKelahiran || 0),
      Number(body.pindahMasuk || 0),
      Number(body.pindahKeluar || 0),
      Number(body.pendudukMusiman || 0)
    ];
    sh.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ok:true, message:'Tersimpan'})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false, message: String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e){
  // action=getAll -> kembalikan semua data sebagai JSON
  try{
    var action = (e.parameter.action || '').toString();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheets()[0];
    var data = sh.getDataRange().getValues();
    var headers = data.shift(); // remove header
    var arr = data.map(function(r){
      var obj = {};
      headers.forEach(function(h,i){ obj[h] = r[i]; });
      return obj;
    });
    // Jika diminta CSV
    if(action === 'csv'){
      var csv = [headers.join(',')].concat(arr.map(function(row){ return headers.map(function(h){ return (''+row[h]).replace(/"/g,'""'); }).join(','); })).join('\n');
      return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
    }
    return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false, message:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
