# Changelog

## [1.4.0] - 2026-09-21

### Sumber data jadwal
- MyQuran (data Kemenag RI) menjadi sumber utama untuk kota di Indonesia
  melalui modul bersama `api.js` (dipakai background, popup, options).
- Aladhan tetap sebagai fallback otomatis (kota tak ditemukan, rate-limit,
  offline) serta sumber utama untuk luar Indonesia dan mode koordinat.
- Pencarian ID kab/kota mengutamakan cocok persis dan mendahulukan KOTA
  di atas KAB, hasilnya di-cache di `storage.local`.
- Dhuha kini memakai nilai asli Kemenag (sebelumnya perkiraan Terbit+1 jam).
- Label sumber tampil di UI (`Kemenag RI` / `Aladhan`); Hijriah fallback via
  Intl saat sumber tidak membawa data Hijriah.

### Popup
- Layout tab `Jadwal` / `Pengaturan` agar popup kompak (tidak memanjang),
  footer persisten (Tes Notifikasi + status jadwal + copyright selalu tampil).
- Highlight jadwal salat berikutnya; status hasil Tes Notifikasi tampil
  langsung di popup (terkirim/gagal/catatan).
- Perbaikan CSP: tanpa inline script; logika tab di `popup.js`.

### Notifikasi & modal halaman
- Handler `TEST_PRAYER_NOTIFICATION` dibungkus per kanal (notifikasi gagal
  tidak menggagalkan modal, respons tetap `ok:true` + `warnings`).
- Tombol Tes anti-macet (timeout 10 detik + selalu di-enable lagi).
- Modal content script: aman XSS (`textContent`), tombol `Nanti 5 mnt`
  (snooze), auto-tutup 90 detik, tutup via ESC/klik-luar, inject
  programmatic untuk tab lama.

### Quote pengingat
- 65 → 44 quote; 100% bersumber: 18 ayat Al-Qur'an, 25 hadits, 1 doa Nabi.
- 32 quote tanpa sumber dihapus; redaksi meragukan diluruskan.
- Rotasi tanpa-ulang via antrean acak (~9 hari untuk 5 salat/hari);
  antrean lama yang basi divalidasi ulang otomatis.

### Keandalan penjadwalan
- Alarm dijadwal ulang otomatis saat pengaturan berubah (debounce),
  retry 15 menit saat offline, alarm snooze dipertahankan,
  status jadwal (`GET_SCHEDULE_STATUS`) tampil di popup.
- Validasi koordinat, parsing waktu tahan format ISO/`HH:MM (WIB)`.

## [1.3.1] - 2026-02-14
- Quote pengingat + peningkatan UI (awal).
- Perombakan popup: countdown, tabel jadwal, geolokasi, autocomplete kota.

## [1.2.0] - 2025-09-26
- Refactor penanganan notifikasi; tanggal Hijriah + info metode/madzhab.
- Refactor struktur kode agar mudah dibaca.

## [1.0.0] - 2025-09-26
- Rilis awal: extension pengingat waktu sholat (notifikasi + pengaturan).
