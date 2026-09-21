# Kebijakan Privasi — Sholat Reminder

Terakhir diperbarui: 21 September 2026.

Sholat Reminder adalah ekstensi pengingat waktu sholat. Privasi pengguna
adalah prioritas: ekstensi ini **tidak mengumpulkan, menyimpan di server,
menjual, atau membagikan data pribadi** kepada pihak mana pun selain yang
dijelaskan di bawah ini.

## Data yang diproses

1. **Pengaturan pengguna** (nama kota, negara, metode perhitungan, madzhab,
   koordinat bila geolokasi diaktifkan)
   - Disimpan **hanya lokal** di perangkat melalui `chrome.storage`
     (sinkronisasi Chrome bila pengguna mengaktifkannya).
   - Tidak dikirim ke server milik pengembang (kami tidak memiliki server).

2. **Lokasi** (nama kota, atau koordinat + akurasi bila pengguna menekan
   "Ambil Lokasi")
   - Dikirim ke API jadwal sholat pihak ketiga **semata-mata untuk mengambil
     jadwal sholat**:
     - `https://api.myquran.com` (sumber data Kemenag RI),
     - `https://api.aladhan.com` (sumber cadangan / luar Indonesia).
   - Data lokasi tidak dibagikan untuk tujuan lain dan tidak dijual.

3. **Izin browser** digunakan hanya untuk fungsi inti:
   - `storage` — menyimpan pengaturan di perangkat.
   - `alarms` — menjadwalkan pengingat waktu sholat.
   - `notifications` — menampilkan notifikasi pengingat.
   - `geolocation` — opsional, jadwal akurat berbasis koordinat.
   - `tabs` / `scripting` + akses halaman web — menampilkan pop-up
     pengingat di halaman yang sedang dibuka.

## Data yang TIDAK kami lakukan

- Tidak ada pelacakan, analitik, iklan, atau SDK pihak ketiga.
- Tidak ada penjualan atau penyewaan data dalam bentuk apa pun.
- Tidak ada pengambilan data di luar fungsi pengingat sholat.

## Kontrol pengguna

- Nonaktifkan geolokasi kapan saja dengan menyimpan kota manual.
- Hapus seluruh data dengan menghapus ekstensi (data `chrome.storage`
  ikut terhapus).

## Kontak

Lapor masalah/permintaan privasi melalui:
<https://github.com/latiefahmad/sholat-reminder/issues>

---

# Privacy Policy — Sholat Reminder

Last updated: September 21, 2026.

Sholat Reminder is a prayer-time reminder extension. We **do not collect,
store on any server, sell, or share personal data**, except as described below.

## Data processed

1. **User settings** (city, country, calculation method, school of thought,
   coordinates if geolocation is enabled)
   - Stored **locally only** on the device via `chrome.storage`.
   - Never sent to any developer-owned server (we operate none).

2. **Location** (city name, or coordinates + accuracy when the user taps
   "Ambil Lokasi")
   - Sent to third-party prayer-time APIs **solely to fetch prayer schedules**:
     - `https://api.myquran.com` (Kemenag RI data source),
     - `https://api.aladhan.com` (fallback / outside Indonesia).
   - Not shared for any other purpose and never sold.

3. **Browser permissions** are used only for core features:
   - `storage`, `alarms`, `notifications`, `geolocation` (optional),
     `tabs` / `scripting` + web-page access to show reminder pop-ups.

## What we do NOT do

- No tracking, analytics, ads, or third-party SDKs.
- No sale or rental of data in any form.

## Contact

<https://github.com/latiefahmad/sholat-reminder/issues>
