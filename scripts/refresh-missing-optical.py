#!/usr/bin/env python3
"""Watchdog optik: refreshObject otomatis untuk ONT yang RX/temperature N/A.

Dijalankan harian via cron. Hanya menyentuh device yang:
  - benar-benar ONT (bukan router TOTOLINK/ZIONCOM, TP-Link/Archer, MikroTik, RAISECOM)
  - sedang online (inform dalam 30 menit terakhir)
  - tidak punya task/fault aktif
  - belum pernah di-refresh dalam 7 hari (cooldown, agar device yang memang
    tidak mengekspos path optik tidak terus-menerus dicoba)

Tidak pernah menulis/mencetak kredensial atau Connection Request URL.
"""

import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

DB = os.environ.get("GENIEACS_DB", "genieacs")
NBI = os.environ.get("GENIEACS_NBI", "http://127.0.0.1:7557")
STATE = os.environ.get(
    "OPTICAL_WATCHDOG_STATE", "/var/lib/genieacs/optical_watchdog_state.json"
)
COOLDOWN_DAYS = int(os.environ.get("OPTICAL_WATCHDOG_COOLDOWN_DAYS", "7"))

QUERY = r"""
var out = [];
var router = /TOTOLINK|ZIONCOM|TP-LINK|TP-Link|Archer|MikroTik|RAISECOM|Raisecom/i;
var online = new Date(Date.now() - 30 * 60000);
var bad = function(v) { return v === undefined || v === null || v === '' || v === 'N/A'; };
var leafCount = function(o) {
  var n = 0;
  (function walk(x) {
    if (!x || typeof x !== 'object') return;
    Object.keys(x).forEach(function(k) {
      if (k === '_value') n++;
      else if (k.charAt(0) !== '_') walk(x[k]);
    });
  })(o);
  return n;
};
db.devices.find({}).forEach(function(d) {
  var vp = d.VirtualParameters || {};
  if (!bad((vp.RXPower || {})._value) && !bad((vp.gettemp || {})._value)) return;
  if (router.test(String(d._deviceId._Manufacturer || ''))) return;
  if (router.test(String(d._deviceId._ProductClass || ''))) return;
  if (!d._lastInform || d._lastInform < online) return;
  if (db.tasks.countDocuments({device: d._id})) return;
  if (db.faults.countDocuments({device: d._id})) return;
  // Tree lengkap tapi optik tetap N/A = device memang tidak expose path.
  // refreshObject tidak akan membantu, jadi skip.
  if (leafCount(d.InternetGatewayDevice) >= 500) return;
  out.push(d._id);
});
print(out.join("\n"));
"""


def candidates():
    out = subprocess.check_output(
        ["mongosh", DB, "--quiet", "--eval", QUERY], text=True
    )
    return [line.strip() for line in out.splitlines() if line.strip()]


def load_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
    os.replace(tmp, STATE)


def refresh(device_id):
    url = "%s/devices/%s/tasks" % (NBI, urllib.parse.quote(device_id, safe=""))
    body = json.dumps({"name": "refreshObject", "objectName": ""}).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 202
    except (urllib.error.URLError, OSError) as e:
        print("  GAGAL %s: %s" % (device_id, e))
        return False


def main():
    now = datetime.now(timezone.utc)
    state = load_state()
    ids = candidates()
    print(
        "[%s] kandidat=%d"
        % (now.strftime("%Y-%m-%d %H:%M:%S UTC"), len(ids))
    )
    sent = skipped = failed = 0
    for device_id in ids:
        last = state.get(device_id)
        if last:
            try:
                then = datetime.fromisoformat(last)
                if now - then < timedelta(days=COOLDOWN_DAYS):
                    skipped += 1
                    continue
            except ValueError:
                pass
        if refresh(device_id):
            state[device_id] = now.isoformat()
            sent += 1
        else:
            failed += 1
    save_state(state)
    print("terkirim=%d cooldown=%d gagal=%d" % (sent, skipped, failed))


if __name__ == "__main__":
    main()
