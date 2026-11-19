#!/usr/bin/env bash
set -euo pipefail

# Apply GenieACS UI customizations (GenieACS 1.2.x bundles; re-run after GenieACS upgrade)
# Usage: sudo bash ui/apply-ui.sh
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="/usr/lib/node_modules/genieacs/public"

if [[ ! -d "$PUBLIC" ]]; then
  echo "ERROR: $PUBLIC not found. Install GenieACS first." >&2
  exit 1
fi

JS_FILE=$(ls "$PUBLIC"/app-*.js 2>/dev/null | head -1 || true)
CSS_FILE=$(ls "$PUBLIC"/app-*.css 2>/dev/null | head -1 || true)
ICON_FILE=$(ls "$PUBLIC"/icons-*.svg 2>/dev/null | head -1 || true)

if [[ -z "$JS_FILE" || -z "$CSS_FILE" ]]; then
  echo "ERROR: GenieACS UI bundles (app-*.js/css) not found in $PUBLIC" >&2
  exit 1
fi

ts=$(date +%Y%m%d%H%M%S)
mkdir -p /root/backups/genieacs-ui-reapply-$ts
cp "$JS_FILE" "/root/backups/genieacs-ui-reapply-$ts/$(basename "$JS_FILE").bak"
cp "$CSS_FILE" "/root/backups/genieacs-ui-reapply-$ts/$(basename "$CSS_FILE").bak"
[[ -n "$ICON_FILE" ]] && cp "$ICON_FILE" "/root/backups/genieacs-ui-reapply-$ts/$(basename "$ICON_FILE").bak"

# Install local assets (logo, bootstrap, icons with view icon)
mkdir -p "$PUBLIC/assets/bootstrap" "$PUBLIC/assets"
cp "$ROOT_DIR/ui/assets/logo-tanjungpilar.png" "$PUBLIC/assets/logo-tanjungpilar.png"
cp "$ROOT_DIR/ui/assets/bootstrap/bootstrap.min.css" "$PUBLIC/assets/bootstrap/bootstrap.min.css"
if [[ -n "$ICON_FILE" ]]; then
  cp "$ROOT_DIR/ui/assets/icons/icons-f3d83e74.svg" "$ICON_FILE"
else
  cp "$ROOT_DIR/ui/assets/icons/icons-f3d83e74.svg" "$PUBLIC/"
fi

# Work on temporary copies, then install into the live bundle filenames
TMPJS="/tmp/genieacs-ui-reapply-$ts.js"
TMPCSS="/tmp/genieacs-ui-reapply-$ts.css"
cp "$JS_FILE" "$TMPJS"
cp "$CSS_FILE" "$TMPCSS"

run_patch_script() {
  local src="$1"
  local tmp="/tmp/$(basename "$src")"
  sed -e "s|/usr/lib/node_modules/genieacs/public/app-FOJWPRV7.js|$TMPJS|g" \
      -e "s|/usr/lib/node_modules/genieacs/public/app-LU66VFYW.css|$TMPCSS|g" "$src" > "$tmp"
  if [[ "$src" == *apply_filter_contains.js ]]; then
    # avoid restarting UI mid-apply; we restart once at the end
    sed -i "/systemctl restart genieacs-ui/d" "$tmp"
  fi
  node "$tmp"
}

echo "== Apply login/modern CSS =="
append_if_missing() {
  local marker="$1" src="$2"
  if grep -qF "$marker" "$TMPCSS"; then
    echo "already: $marker"; return
  fi
  cat "$src" >> "$TMPCSS"
  echo "applied: $marker"
}
append_if_missing "Custom: Login page - center the login box" "$ROOT_DIR/ui/css/login-center.css"
append_if_missing "Custom: Login logo - Tanjung Pilar"         "$ROOT_DIR/ui/css/login-logo.css"
append_if_missing "Modern UI - Phase 1"                       "$ROOT_DIR/ui/css/phase1-modern.css"
append_if_missing "Modern UI - Phase 2 ("                     "$ROOT_DIR/ui/css/phase2-modern.css"
append_if_missing "Modern UI - Phase 2.5"                     "$ROOT_DIR/ui/css/phase2-5-modern.css"
append_if_missing "Modern UI - Phase 2.6"                     "$ROOT_DIR/ui/css/phase2-6-compact-tables.css"
append_if_missing "Modern UI - Phase 2.7"                     "$ROOT_DIR/ui/css/phase2-7-filter-bar.css"

echo "== Apply filter-contains (JS + DB) =="
run_patch_script "$ROOT_DIR/ui/patches/apply_filter_contains.js"

echo "== Apply devices UI tweaks (JS + CSS + DB) =="
run_patch_script "$ROOT_DIR/ui/scripts/apply_devices_ui_tweak.js"

echo "== Apply device view tidy (JS + CSS) =="
run_patch_script "$ROOT_DIR/ui/scripts/apply_device_view.js"

echo "== Apply overview tidy (JS + CSS) =="
run_patch_script "$ROOT_DIR/ui/scripts/apply_overview_tidy.js"

echo "== Apply menu/tabs tidy (CSS) =="
run_patch_script "$ROOT_DIR/ui/scripts/apply_menu_tabs_tidy.js"

cp "$TMPJS" "$JS_FILE"
cp "$TMPCSS" "$CSS_FILE"

systemctl restart genieacs-ui || true
sleep 2
echo "UI status: $(systemctl is-active genieacs-ui || true)"
echo "UI HTTP: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || true)"
echo "Backups: /root/backups/genieacs-ui-reapply-$ts"
echo "Done. Hard-refresh browser (Ctrl+F5)."
