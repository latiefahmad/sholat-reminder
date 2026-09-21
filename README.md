# 🕌 Sholat Reminder

Ekstensi Chrome pengingat waktu sholat otomatis: notifikasi sistem + pop-up
di halaman web setiap waktu salat tiba, lengkap dengan countdown, jadwal
harian, dan quote bersumber.

## ✨ Fitur

- **Pengingat otomatis 5 waktu** — notifikasi sistem + modal di semua tab yang terbuka.
- **Data resmi Kemenag RI** via [MyQuran](https://api.myquran.com) sebagai sumber
  utama untuk kota di Indonesia (ID kab/kota resmi, tanpa salah geocode),
  dengan **Aladhan sebagai fallback** otomatis (dan sumber utama untuk luar
  Indonesia / mode koordinat).
- **Popup kompak** — tab `Jadwal` / `Pengaturan`, countdown salat berikutnya,
  highlight jadwal terdekat, tanggal Masehi + Hijriah, status penjadwalan.
- **Fleksibel** — pilih kota (autocomplete), metode perhitungan, madzhab Asr,
  atau pakai **geolokasi** untuk jadwal berbasis koordinat presisi tinggi.
- **Tombol Tes Notifikasi** — cek pengingat kapan saja, hasilnya tampil
  langsung di popup.
- **Snooze** — tunda pengingat 5 menit dari modal (`Nanti 5 mnt`).
- **44 quote bersumber** — 18 ayat Al-Qur'an, 25 hadits, 1 doa Nabi.
  Rotasi tanpa pengulangan (~9 hari untuk 5 salat/hari).
- **Halaman Options** — pengaturan + pratinjau jadwal hari ini.
- **Tahan gangguan** — jadwal ulang otomatis saat pengaturan berubah, retry
  saat offline, alarm snooze tidak ikut terhapus.

## 📦 Instalasi

**Dari source (mode developer):**

1. Clone repo ini.
2. Buka `chrome://extensions` → aktifkan **Developer mode**.
3. **Load unpacked** → pilih folder repo.
4. Klik ikon ekstensi → atur kota → **Simpan**.

**Dari Chrome Web Store:** *(segera hadir)*

## 🖥️ Cara pakai

1. Buka popup → tab **Pengaturan** → isi kota + negara (contoh: `Malang` /
   `Indonesia`), atau klik **Ambil Lokasi**.
2. Klik **Simpan** — jadwal hari ini langsung dijadwalkan ulang.
3. Saat waktu salat tiba: notifikasi muncul + modal tampil di halaman web.
4. Klik **Tes Notifikasi** untuk mencoba tanpa menunggu waktu salat.

## 🔌 Sumber data

| Sumber | Peran |
|---|---|
| `api.myquran.com` (Kemenag RI) | Utama — kota di Indonesia |
| `api.aladhan.com` | Fallback + luar Indonesia + mode koordinat |

Dokumentasi API: <https://api.myquran.com/doc>
dan <https://documenter.getpostman.com/view/841292/2s9YsGittd>

## 🔒 Privasi & izin

- Tidak ada pelacakan, analitik, iklan, atau server milik pengembang.
- Lokasi hanya dikirim ke API jadwal di atas untuk mengambil waktu sholat.
- Detail lengkap: [PRIVACY.md](PRIVACY.md)
- Izin `tabs`/`scripting` + akses halaman web hanya untuk menampilkan modal
  pengingat; `geolocation` opsional (mode koordinat).

## 🗂️ Struktur proyek

```text
manifest.json   Konfigurasi extension (MV3)
api.js          Lapisan sumber data (MyQuran + fallback Aladhan)
background.js   Service worker: alarm, notifikasi, quote, snooze
content.js      Modal pengingat di halaman web
popup.html/js   Popup: jadwal, countdown, pengaturan
options.html/js Halaman pengaturan + pratinjau jadwal
icon-sholat.png Ikon
```

## 📝 Changelog

Lihat [CHANGELOG.md](CHANGELOG.md).

## 🤝 Kontribusi & laporan bug

Silakan buka issue/PR di:
<https://github.com/latiefahmad/sholat-reminder/issues>

---
(c) 2025 latiefahmad
