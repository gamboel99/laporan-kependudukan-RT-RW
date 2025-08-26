import React, { useEffect, useMemo, useState } from \"react\";

// === QUICK START ===
// 1) Masukkan URL Web App Google Apps Script pada tombol \"Pengaturan\" (tersimpan di localStorage).
// 2) Isi form lalu klik \"Kirim Laporan\". Data akan dikirim via POST (JSON) ke Apps Script Anda.
// 3) Lihat petunjuk penyambungan ke Google Sheet di bawah (di UI) atau minta di chat ini.

export default function App() {
  // Settings (persist to localStorage)
  const [scriptUrl, setScriptUrl] = useState(\"\");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(\"lapor-kependudukan-script-url\");
    if (saved) setScriptUrl(saved);
  }, []);

  const saveSettings = () => {
    localStorage.setItem(\"lapor-kependudukan-script-url\", scriptUrl.trim());
    setShowSettings(false);
  };

  // Form state
  const [form, setForm] = useState({
    bulanEntri: \"\",
    rw: \"\",
    rt: \"\",
    jumlahPenduduk: \"\",
    jumlahKK: \"\",
    jumlahKematian: \"\",
    jumlahKelahiran: \"\",
    pindahMasuk: \"\",
    pindahKeluar: \"\",
    pendudukMusiman: \"\",
  });

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: \"idle\" });

  const villageHeader = \"Pemerintah Desa Keling, Kecamatan Kepung, Kabupaten Kediri\";
  const title = \"Laporan Kependudukan Bulanan\";

  const allNumbersValid = useMemo(() => {
    const keys = [
      \"jumlahPenduduk\",
      \"jumlahKK\",
      \"jumlahKematian\",
      \"jumlahKelahiran\",
      \"pindahMasuk\",
      \"pindahKeluar\",
      \"pendudukMusiman\",
    ];
    return keys.every((k) => {
      const v = form[k];
      if (v === \"\") return false;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && Number.isInteger(n);
    });
  }, [form]);

  const isReadyToSubmit = form.bulanEntri && form.rw && form.rt && allNumbersValid && !!scriptUrl;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      bulanEntri: \"\",
      rw: \"\",
      rt: \"\",
      jumlahPenduduk: \"\",
      jumlahKK: \"\",
      jumlahKematian: \"\",
      jumlahKelahiran: \"\",
      pindahMasuk: \"\",
      pindahKeluar: \"\",
      pendudukMusiman: \"\",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: \"idle\" });

    if (!scriptUrl) {
      setStatus({ type: \"error\", message: \"URL Apps Script belum diatur di Pengaturan.\" });
      return;
    }

    if (!isReadyToSubmit) {
      setStatus({ type: \"error\", message: \"Mohon lengkapi form dengan angka valid (>=0).\" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        ...form,
      };

      const res = await fetch(scriptUrl, {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(\"Gagal mengirim ke Apps Script\");

      const data = await res.json().catch(() => ({}));
      setStatus({ type: \"success\", message: data.message || \"Laporan berhasil dikirim dan tersimpan.\" });
      resetForm();
    } catch (err) {
      setStatus({ type: \"error\", message: err.message || \"Terjadi kesalahan saat mengirim data.\" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <header className=\"bg-blue-700 text-white shadow-sm\">
        <div className=\"max-w-5xl mx-auto px-4 py-5\">
          <p className=\"text-sm uppercase tracking-wider opacity-90\">{villageHeader}</p>
          <h1 className=\"text-2xl md:text-3xl font-bold mt-1\">{title}</h1>
        </div>
      </header>
      <main className=\"max-w-5xl mx-auto px-4 py-6\">
        <form onSubmit={handleSubmit} className=\"bg-white rounded-2xl shadow p-5 space-y-4\">
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
            <div>
              <label>Bulan Entri</label>
              <input type=\"month\" name=\"bulanEntri\" value={form.bulanEntri} onChange={onChange} required />
            </div>
            <div>
              <label>RW</label>
              <input type=\"number\" name=\"rw\" value={form.rw} onChange={onChange} required />
            </div>
            <div>
              <label>RT</label>
              <input type=\"number\" name=\"rt\" value={form.rt} onChange={onChange} required />
            </div>
          </div>
          {[
            { name: \"jumlahPenduduk\", label: \"Jumlah Penduduk\" },
            { name: \"jumlahKK\", label: \"Jumlah KK\" },
            { name: \"jumlahKematian\", label: \"Jumlah Kematian\" },
            { name: \"jumlahKelahiran\", label: \"Jumlah Kelahiran\" },
            { name: \"pindahMasuk\", label: \"Jumlah Warga Pindah Masuk\" },
            { name: \"pindahKeluar\", label: \"Jumlah Warga Pindah Keluar\" },
            { name: \"pendudukMusiman\", label: \"Penduduk Musiman/Mukim Sementara\" },
          ].map((f) => (
            <div key={f.name}>
              <label>{f.label}</label>
              <input type=\"number\" name={f.name} value={form[f.name]} onChange={onChange} required />
            </div>
          ))}
          <button type=\"submit\" disabled={!isReadyToSubmit || submitting}>
            {submitting ? \"Mengirim...\" : \"Kirim Laporan\"}
          </button>
        </form>
        {status.type !== \"idle\" && <p>{status.message}</p>}
      </main>
    </div>
  );
}
