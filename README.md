# genieacs-jatim-vers-2026

Template konfigurasi **GenieACS 1.2.13** (Jatim, 2026) — config/preset/provision/virtual parameter, kustomisasi UI, dan panduan deploy.

> **Sebelum dipakai:** sesuaikan nilai environment-spesifik (ACS URL, kredensial Connection Request, password provision, `GENIEACS_UI_JWT_SECRET`, timezone, user UI). Lihat [docs/DEPLOY.md](docs/DEPLOY.md).

## Informasi server (lingkungan sumber)

Template ini disiapkan dari server/lingkungan berikut:

| Komponen | Detail |
|---|---|
| Hostname | `genieacs` |
| IP (ACS host) | `172.16.20.8/24` (`eth0`) |
| OS | Ubuntu 22.04.5 LTS (Jammy Jellyfish) |
| Kernel / Arsitektur | Linux 6.8.12-15-pve, x86-64 |
| Virtualisasi | LXC container (Proxmox VE) |
| Timezone | Asia/Jakarta (WIB, UTC+7) |
| GenieACS | 1.2.13+240606fc80 |
| Node.js / npm | v22.23.4 / 10.9.9 |
| MongoDB | 8.0.34 (`mongod`, database `genieacs`) |
| Services (systemd) | `genieacs-ui`, `genieacs-cwmp`, `genieacs-nbi`, `genieacs-fs`, `mongod` |
| Port | UI `:3000`, CWMP `:7547`, NBI `:7557` |

> Catatan: IP/hostname di atas adalah lingkungan sumber. Saat deploy di server lain, sesuaikan `env/genieacs.env`, provision `inform` (URL ACS & kredensial Connection Request), user UI, dan pengaturan jaringan/firewall.

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
