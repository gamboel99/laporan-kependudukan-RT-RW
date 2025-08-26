// Ganti dengan URL Google Apps Script milik Bapak
const SCRIPT_URL = "PASTE_URL_WEB_APP_DISINI";

document.getElementById("laporanForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.timestamp = new Date().toISOString();

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();
    document.getElementById("status").textContent = result.message || "Terkirim.";
    e.target.reset();
  } catch (err) {
    document.getElementById("status").textContent = "Gagal mengirim: " + err;
  }
});
