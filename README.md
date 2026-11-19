# genieacs-jatim-vers-2026

Template konfigurasi **GenieACS 1.2.13** (Jatim, 2026) — config/preset/provision/virtual parameter, kustomisasi UI, dan panduan deploy.

> **Sebelum dipakai:** sesuaikan nilai environment-spesifik (ACS URL, kredensial Connection Request, password provision, `GENIEACS_UI_JWT_SECRET`, timezone, user UI). Lihat [docs/DEPLOY.md](docs/DEPLOY.md).

## Isi
- `db/` — ekspor NDJSON: `config`, `presets`, `provisions`, `virtualParameters`, `permissions`, `files` (tanpa users/device/fault/task/operational data)
- `ui/` — aset & kustomisasi UI + [`ui/apply-ui.sh`](ui/apply-ui.sh)
- `env/`, `systemd/` — contoh env & unit service
- `scripts/` — `export-config.py`, `import-config.py`, salinan skrip provision/VP
- `docs/` — [DEPLOY.md](docs/DEPLOY.md), [POST-UPGRADE.md](docs/POST-UPGRADE.md), [NOTES.md](docs/NOTES.md)

## Quick start
```bash
# 1. siapkan MongoDB, Node.js, GenieACS 1.2.13 + env/systemd (lihat docs/DEPLOY.md)
python3 scripts/import-config.py --dir db        # 2. impor konfigurasi
sudo bash ui/apply-ui.sh                         # 3. terapkan UI
# 4. ganti placeholder (inform/useradmin/JWT), set TZ, buat user UI, verifikasi
```

Target: Ubuntu 22.04, MongoDB 8.x, Node.js 22.x, GenieACS 1.2.13. Hard-refresh browser (`Ctrl+F5`) setelah apply UI.
