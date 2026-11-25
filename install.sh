#!/usr/bin/env bash
# GenieACS Jatim 2026 - Installer
# Target: Ubuntu Server 22.04 LTS (recommended). Run as root.
# Usage:
#   sudo bash install.sh
#   sudo bash install.sh --noninteractive   (requires env vars, see README)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENIEACS_VERSION="${GENIEACS_VERSION:-1.2.13}"
MONGO_PKG="${MONGO_PKG:-mongodb-org}"   # mongodb-org (recommended)
NODE_MAJOR="${NODE_MAJOR:-22}"
TZ_DEFAULT="${TZ_DEFAULT:-Asia/Jakarta}"
DB_NAME="${DB_NAME:-genieacs}"
NONINTERACTIVE=0

for arg in "$@"; do
  case "$arg" in
    --noninteractive|-y|--yes) NONINTERACTIVE=1 ;;
    -h|--help)
      sed -n '1,40p' "$0"; exit 0 ;;
  esac
done

if [[ ! -t 0 ]]; then NONINTERACTIVE=1; fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[installer]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }
die()  { err "$*"; exit 1; }

need_root() {
  [[ ${EUID:-$(id -u)} -eq 0 ]] || die "Jalankan sebagai root: sudo bash install.sh"
}

check_os() {
  if [[ -f /etc/os-release ]]; then . /etc/os-release; else ID=unknown; VERSION_ID=unknown; fi
  log "OS terdeteksi: ${PRETTY_NAME:-$ID $VERSION_ID}"
  if [[ "${ID:-}" != "ubuntu" ]]; then
    warn "Installer dioptimalkan untuk Ubuntu 22.04 LTS. Lanjut dengan risiko sendiri."
  elif [[ "${VERSION_ID:-}" != "22.04" ]]; then
    warn "Direkomendasikan Ubuntu 22.04 LTS (terdeteksi ${VERSION_ID}). Lanjut..."
  fi
}

prompt() { # var prompt default secret
  local __var="$1" __prompt="$2" __def="${3:-}" __secret="${4:-0}" __val=""
  if [[ $NONINTERACTIVE -eq 1 ]]; then
    __val="${!__var:-$__def}"
    [[ -n "$__val" ]] || die "Mode noninteractive: variabel $__var wajib diisi"
    printf -v "$__var" '%s' "$__val"
    return
  fi
  if [[ "$__secret" == "1" ]]; then
    read -r -s -p "$__prompt${__def:+ [$__def]}: " __val; echo
  else
    read -r -p "$__prompt${__def:+ [$__def]}: " __val
  fi
  [[ -z "$__val" ]] && __val="$__def"
  printf -v "$__var" '%s' "$__val"
}

prompt_required() { # var prompt secret
  local __var="$1" __prompt="$2" __secret="${3:-0}" __val=""
  while true; do
    if [[ $NONINTERACTIVE -eq 1 ]]; then
      __val="${!__var:-}"
      [[ -n "$__val" ]] || die "Mode noninteractive: variabel $__var wajib diisi"
      printf -v "$__var" '%s' "$__val"; return
    fi
    if [[ "$__secret" == "1" ]]; then read -r -s -p "$__prompt: " __val; echo
    else read -r -p "$__prompt: " __val; fi
    [[ -n "$__val" ]] && { printf -v "$__var" '%s' "$__val"; return; }
    warn "Nilai tidak boleh kosong."
  done
}

rand_secret() { openssl rand -hex 32; }

detect_ip() {
  hostname -I 2>/dev/null | awk '{print $1}' || ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1 || echo "127.0.0.1"
}

apt_base() {
  log "Update apt & pasang paket dasar..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release software-properties-common \
    git python3 python3-pip openssl tzdata iproute2 procps >/dev/null
  ok "Paket dasar siap"
}

install_mongodb() {
  if command -v mongod >/dev/null 2>&1; then
    ok "MongoDB sudah terpasang: $(mongod --version | head -1 || true)"
  else
    log "Memasang MongoDB 8.0..."
    . /etc/os-release
    local codename="${VERSION_CODENAME:-jammy}"
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
    chmod 644 /usr/share/keyrings/mongodb-server-8.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${codename}/mongodb-org/8.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt-get update -y
    apt-get install -y mongodb-org >/dev/null
    ok "MongoDB terpasang"
  fi
  systemctl enable mongod >/dev/null 2>&1 || true
  systemctl start mongod || systemctl restart mongod || true
  # wait for mongod
  for i in $(seq 1 30); do
    if mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; then ok "mongod siap"; return; fi
    sleep 1
  done
  warn "mongod belum merespons ping; lanjut (cek: systemctl status mongod)"
}

install_node() {
  local need=1
  if command -v node >/dev/null 2>&1; then
    local v; v=$(node -v | sed 's/^v//' | cut -d. -f1)
    if [[ "$v" -ge "$NODE_MAJOR" ]]; then need=0; ok "Node.js sudah terpasang: $(node -v)"; fi
  fi
  if [[ $need -eq 1 ]]; then
    log "Memasang Node.js ${NODE_MAJOR}.x..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs >/dev/null
    ok "Node.js terpasang: $(node -v), npm $(npm -v)"
  fi
}

install_genieacs() {
  log "Memasang GenieACS ${GENIEACS_VERSION}..."
  npm install -g "genieacs@${GENIEACS_VERSION}" >/dev/null
  id genieacs >/dev/null 2>&1 || useradd --system --no-create-home --user-group genieacs
  mkdir -p /opt/genieacs/ext /var/log/genieacs
  chown -R genieacs:genieacs /opt/genieacs /var/log/genieacs
  ok "GenieACS terpasang: $(genieacs-ui --version 2>/dev/null || echo "$GENIEACS_VERSION")"
}

collect_config() {
  local def_ip; def_ip="$(detect_ip)"
  echo
  log "Konfigurasi awal (nilai ini dapat diubah nanti)"
  prompt ACS_HOST "IP/hostname ACS yang dapat dijangkau CPE" "$def_ip"
  prompt CONNREQ_USER "Username Connection Request (CPE)" "acs"
  prompt_required CONNREQ_PASS "Password Connection Request (CPE)" 1
  prompt DEVICE_USER "Username admin perangkat (provision useradmin)" "user"
  prompt_required DEVICE_PASS "Password admin perangkat (provision useradmin)" 1
  prompt UI_ADMIN_USER "Username admin UI GenieACS" "admin"
  prompt_required UI_ADMIN_PASS "Password admin UI GenieACS" 1
  GENIEACS_UI_JWT_SECRET="${GENIEACS_UI_JWT_SECRET:-$(rand_secret)}"
  if [[ $NONINTERACTIVE -eq 0 ]]; then
    echo -e "${CYAN}[info]${NC} GENIEACS_UI_JWT_SECRET dibuat otomatis (acak)."
  fi
  TZ="${TZ:-$TZ_DEFAULT}"
}

write_env() {
  log "Menulis environment /opt/genieacs/genieacs.env ..."
  install -d -m 755 /opt/genieacs
  cat > /opt/genieacs/genieacs.env <<EOF
GENIEACS_CWMP_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-cwmp-access.log
GENIEACS_NBI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-nbi-access.log
GENIEACS_FS_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-fs-access.log
GENIEACS_UI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-ui-access.log
GENIEACS_DEBUG_FILE=/var/log/genieacs/genieacs-debug.yaml
GENIEACS_EXT_DIR=/opt/genieacs/ext
GENIEACS_UI_JWT_SECRET=${GENIEACS_UI_JWT_SECRET}
EOF
  chown genieacs:genieacs /opt/genieacs/genieacs.env
  chmod 600 /opt/genieacs/genieacs.env
  ok "Environment ditulis"
}

install_services() {
  log "Memasang systemd service..."
  cp "$REPO_DIR"/systemd/genieacs-*.service /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui >/dev/null 2>&1 || true
  systemctl restart genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui || true
  ok "Service GenieACS dijalankan"
}

import_db() {
  log "Impor konfigurasi GenieACS ke MongoDB (db/*.ndjson)..."
  (cd "$REPO_DIR" && python3 scripts/import-config.py --dir db)
  ok "Konfigurasi diimpor"
}

configure_db() {
  log "Menerapkan konfigurasi lingkungan (inform, useradmin, user UI)..."
  python3 "$REPO_DIR/scripts/configure-provisions.py" \
    --acs-host "$ACS_HOST" --acs-port 7547 \
    --connreq-user "$CONNREQ_USER" --connreq-pass "$CONNREQ_PASS" \
    --device-user "$DEVICE_USER" --device-pass "$DEVICE_PASS" \
    --db "$DB_NAME"
  python3 "$REPO_DIR/scripts/create-admin-user.py" "$UI_ADMIN_USER" "$UI_ADMIN_PASS" --role admin --db "$DB_NAME"
  ok "Provision & user UI dikonfigurasi"
}

set_timezone() {
  log "Mengatur timezone ${TZ}..."
  if command -v timedatectl >/dev/null 2>&1; then
    timedatectl set-timezone "$TZ" || warn "Gagal set timezone otomatis"
  fi
}

apply_ui() {
  log "Menerapkan kustomisasi UI..."
  bash "$REPO_DIR/ui/apply-ui.sh"
  ok "Kustomisasi UI diterapkan"
}

install_watchdog() {
  log "Memasang watchdog optik (refreshObject otomatis, 03:00 WIB)..."
  install -d -m 755 /var/lib/genieacs
  cat > /etc/cron.d/genieacs-optical-watchdog <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 3 * * * root /usr/bin/python3 ${REPO_DIR}/scripts/refresh-missing-optical.py >> /var/log/genieacs-optical-watchdog.log 2>&1
EOF
  chmod 644 /etc/cron.d/genieacs-optical-watchdog
  ok "Watchdog optik terpasang"
}

restart_all() {
  log "Restart service..."
  systemctl restart mongod genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui || true
  sleep 3
}

verify() {
  log "Verifikasi..."
  local ok_all=1
  for s in mongod genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui; do
    if systemctl is-active --quiet "$s"; then echo -e "  ${GREEN}●${NC} $s: active"; else echo -e "  ${RED}●${NC} $s: $(systemctl is-active "$s" 2>&1 || true)"; ok_all=0; fi
  done
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo "000")
  echo "  UI HTTP (local): $code"
  mongosh "$DB_NAME" --quiet --eval 'printjson({config:db.config.countDocuments(),presets:db.presets.countDocuments(),provisions:db.provisions.countDocuments(),vparams:db.virtualParameters.countDocuments(),permissions:db.permissions.countDocuments(),users:db.users.countDocuments()})' 2>/dev/null || true
  [[ $ok_all -eq 1 ]] || warn "Ada service yang belum aktif. Periksa: journalctl -u genieacs-ui -u genieacs-cwmp -n 100 --no-pager"
}

summary() {
  local host="$ACS_HOST"
  echo
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN} Instalasi GenieACS selesai${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo " UI Web      : http://${host}:3000/"
  echo " CWMP (CPE)  : http://${host}:7547/  (ACS URL di provision inform)"
  echo " NBI (API)   : http://${host}:7557/  (batasi akses/firewall)"
  echo " Admin UI    : ${UI_ADMIN_USER} (password yang Anda set)"
  echo " Database    : MongoDB '${DB_NAME}' (lokal)"
  echo " Timezone    : ${TZ}"
  echo
  echo "Langkah berikutnya:"
  echo " 1. Buka UI dan login dengan user admin di atas."
  echo " 2. Pastikan port 7547 dapat dijangkau CPE/ONT dan firewall mengizinkan (3000/7547 sesuai kebijakan)."
  echo " 3. Arahkan CPE ke ACS URL http://${host}:7547 dengan kredensial Connection Request yang telah dikonfigurasi."
  echo " 4. Hard-refresh browser (Ctrl+F5) jika tampilan UI belum berubah."
  echo
  echo "Pemeliharaan: sudo bash ui/apply-ui.sh (setelah upgrade GenieACS), docs/POST-UPGRADE.md, docs/NOTES.md"
}

main() {
  need_root
  check_os
  apt_base
  install_mongodb
  install_node
  install_genieacs
  collect_config
  write_env
  install_services
  import_db
  configure_db
  set_timezone
  apply_ui
  install_watchdog
  restart_all
  verify
  summary
}

main "$@"
