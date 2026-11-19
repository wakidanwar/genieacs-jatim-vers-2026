# Deploy GenieACS (genieacs-jatim-vers-2026)

Template konfigurasi GenieACS 1.2.13 (Ubuntu 22.04 / MongoDB 8 / Node.js 22) untuk deployment baru.

## Isi template
- `db/*.ndjson` — ekspor konfigurasi GenieACS: `config` (UI/index/filters/overview/device view, cwmp), `presets`, `provisions`, `virtualParameters`, `permissions`, `files` (kosong). **Tidak** termasuk `users`, `devices`, `tasks`, `faults`, `operations`, `cache`, `locks` (data live/kredensial).
- `scripts/provisions|virtualParameters/*.js` — salinan skrip (readable) dari koleksi DB; sumber kebenaran impor ada di `db/*.ndjson`.
- `ui/` — aset & patch UI lokal (logo, Bootstrap 5.3.3 tokens/CSS, icon `view`, patch JS/CSS/DB) + `ui/apply-ui.sh` untuk reapply setelah upgrade/instal.
- `env/genieacs.env.example`, `systemd/*.service` — contoh environment & unit systemd.
- `scripts/export-config.py`, `scripts/import-config.py` — ekspor/impor konfigurasi (mongosh, upsert).

## Prasyarat (disarankan, sesuai sumber)
- Ubuntu 22.04 LTS
- MongoDB (disiapkan: 8.0.x) berjalan sebagai `mongod`
- Node.js (disiapkan: 22.x) + npm
- GenieACS **1.2.13+240606fc80** (patch UI di repo ini menargetkan bundle `app-FOJWPRV7.js`, `app-LU66VFYW.css`, `icons-f3d83e74.svg`)

## 1) Pasang MongoDB & Node.js
Pasang MongoDB 8.0 dan Node.js 22 sesuai dokumentasi resmi distro/vendor Anda, lalu:
```bash
sudo systemctl enable --now mongod
mongod --version | head -2
node -v && npm -v
```

## 2) Pasang GenieACS 1.2.13
```bash
sudo npm install -g genieacs@1.2.13
id genieacs || sudo useradd --system --no-create-home --user-group genieacs
sudo mkdir -p /opt/genieacs/ext /var/log/genieacs
sudo chown -R genieacs:genieacs /opt/genieacs /var/log/genieacs
```
Pastikan binary/unit terpasang: `/usr/bin/genieacs-{cwmp,nbi,fs,ui}` dan service di `/etc/systemd/system/` (atau salin dari `systemd/` di repo ini).

## 3) Environment (WAJIB disesuaikan)
```bash
sudo cp env/genieacs.env.example /opt/genieacs/genieacs.env
sudo chown genieacs:genieacs /opt/genieacs/genieacs.env
sudo chmod 600 /opt/genieacs/genieacs.env
sudoedit /opt/genieacs/genieacs.env
```
- Set `GENIEACS_UI_JWT_SECRET` ke nilai random panjang yang unik.
- (Opsional) sesuaikan path log/`GENIEACS_EXT_DIR`.

## 4) Systemd
```bash
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui
sudo systemctl status genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui --no-pager
```

## 5) Impor konfigurasi ke MongoDB
> Jalankan dari root repo ini. Impor bersifat *upsert* (aman diulang). `--prune` menghapus entri koleksi target yang tidak ada di file — **jangan** pakai kecuali Anda paham dampaknya.

```bash
python3 scripts/import-config.py --dir db
```
(Butuh `mongosh` dan database `genieacs` dapat diakses lokal.)

## 6) SESUAIKAN nilai spesifik lingkungan (penting)
Beberapa nilai sengaja dibuat placeholder/sesuai sumber dan harus diubah:

1. **ACS URL & kredensial Connection Request** (dipakai CPE untuk konek balik): edit provision `inform`.
   - Di DB: `db.provisions.ndjson` (id `inform`) lalu `python3 scripts/import-config.py --dir db --only provisions`, atau edit lewat UI Admin → Provisions (`inform`).
   - Ganti: `const url = "http://<ACS_HOST>:7547";`, `ConnReqUser`, `ConnReqPass` dengan IP/host ACS Anda dan kredensial yang kuat & konsisten dengan pengaturan CPE.
2. **Kredensial admin perangkat (provision `useradmin`)**: ganti `<USER_PASSWORD>` / `<SUPER_PASSWORD>` (atau sesuaikan kebijakan) sebelum dipakai produksi.
3. **Timezone server & services**:
   ```bash
   sudo timedatectl set-timezone Asia/Jakarta
   sudo systemctl restart genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui mongod
   ```
4. **Buat user UI GenieACS** (koleksi `users` tidak diimpor):
   ```bash
   # contoh (sesuaikan per versi/CLI yang tersedia)
   genieacs-ui --help | grep -i user || true
   # jika tersedia: sudo -u genieacs genieacs-ui create-user <username> <password> admin
   ```
   Pastikan role `admin` memiliki permission (sudah ada di `db/permissions.ndjson`).

## 7) Terapkan kustomisasi UI
```bash
sudo bash ui/apply-ui.sh
```
- Idempoten; membuat backup bundle di `/root/backups/genieacs-ui-reapply-*` dan me-restart `genieacs-ui`.
- **Patch JS menargetkan bundle bernama** `app-FOJWPRV7.js` / `app-LU66VFYW.css` (GenieACS 1.2.13). Setelah upgrade GenieACS, nama bundle bisa berubah — script bekerja pada nama file live saat ini, tetapi **pola string patch mungkin perlu disesuaikan** jika bundle berubah; verifikasi UI & hard-refresh (`Ctrl+F5`).

## 8) Verifikasi
```bash
systemctl is-active mongod genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
mongosh genieacs --quiet --eval 'printjson({config:db.config.countDocuments(), presets:db.presets.countDocuments(), provisions:db.provisions.countDocuments(), vparams:db.virtualParameters.countDocuments(), perms:db.permissions.countDocuments()})'
```
Buka `http://<ACS_HOST>:3000/` (Overview/Devices) dan hard-refresh.

## 9) Ekspor ulang (backup konfigurasi sebagai template)
Setelah perubahan yang ingin disimpan ke repo:
```bash
python3 scripts/export-config.py db
```
Periksa diff, **pastikan tidak ada kredensial/data live** sebelum commit/push.

## Catatan operasional
- CWMP listen default `:7547`, NBI `:7557`, UI `:3000` (atur firewall sesuai kebutuhan). MongoDB sebaiknya tidak diekspos publik.
- Periodic Inform & `cwmp.deviceOnlineThreshold` (30000) menentukan status online; panggilan on-demand via NBI connection request.
- TOTOLINK (`ZIONCOM`, N200RE/N300RT) punya guard khusus & preset terpisah; vendor lain dipertahankan apa adanya.
- Reapply UI setelah setiap upgrade paket GenieACS (upgrade dapat menimpa `public/`).
