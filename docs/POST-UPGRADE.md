# Setelah upgrade GenieACS

Upgrade paket GenieACS dapat menimpa `public/` (bundle JS/CSS/icon) dan/atau `bin/genieacs-ui`.

1. **Terapkan ulang UI & patch**
   ```bash
   sudo bash ui/apply-ui.sh
   ```
   Script idempoten, backup bundle, restart `genieacs-ui`. Jika nama/pola bundle berubah signifikan, sesuaikan patch di `ui/patches` & `ui/scripts` lalu verifikasi.

2. **Pastikan config DB tetap utuh** (upgrade normal tidak menghapus MongoDB). Jika perlu sinkron ulang template:
   ```bash
   python3 scripts/import-config.py --dir db
   ```

3. **Verifikasi**
   ```bash
   systemctl is-active genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui
   curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
   ```
   Hard-refresh browser (`Ctrl+F5`).

4. **Sesuaikan ulang nilai lingkungan** bila file env/service ditimpa (cek `/opt/genieacs/genieacs.env`, `GENIEACS_UI_JWT_SECRET`, URL/kredensial provision `inform`).
