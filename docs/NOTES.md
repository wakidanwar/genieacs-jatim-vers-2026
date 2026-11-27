# Catatan konfigurasi (ringkas)

- **GenieACS:** 1.2.13+240606fc80, UI :3000, CWMP :7547, NBI :7557. Services: `genieacs-{ui,cwmp,nbi,fs}` + `mongod`. TZ disarankan `Asia/Jakarta`.
- **Config (`db/config.ndjson`):** `ui.index.*` (17 kolom, Summon icon biru + preview/view di kanan Status, tag compact, Mac fallback), `ui.filters.*` (Product class & ID string-contains, Manufacturer, Last Inform, pppoeUsername2), `ui.overview.*` (Status/Access Type/Optical RX, Merk Perangkat/Devices Register/Optical Temperatur — termasuk slice N/A), `ui.device.*`, `cwmp.*` (connectionRequestTimeout 10000, deviceOnlineThreshold 30000).
- **Presets:** `bootstrap`, `default`, `inform`, `useradmin`, `preset_totolink` (TOTOLINK_N200RE/N300RT → provision `totolink`), `preset_btpon`, `preset_zimmlink`.
- **Provisions/VP:** guard TOTOLINK/unsupported path (hindari `cwmp.9003`), normalisasi RX/temp/serial/PON/MAC/vendor, `inform` mengatur ACS URL + PeriodicInform + ConnectionRequest cred (placeholder di template — **wajib ganti**).
- **UI:** login center+logo, Modern UI phase 1/2/2.5/2.6/2.7 (CSS), filter-contains (bundle JS + config), devices tweaks, device view tidy, overview tidy, menu/tabs tidy. Reapply via `ui/apply-ui.sh`.
- **Maintenance:** `scripts/refresh-tree-staggered.py` dipasang via `/etc/cron.d/genieacs-tree-refresh` tiap 30 menit, satu device per run, cooldown 7 hari. State: `/var/lib/genieacs/tree_refresh_state.json`. Tidak memakai preset in-session (memicu `too_many_commits`/`session_terminated` pada device kecil).
- **Keamanan:** jangan commit `env/genieacs.env`, `db/users.ndjson`, data device/fault/task, atau kredensial nyata. Ganti semua placeholder sebelum produksi.
