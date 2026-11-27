#!/usr/bin/env python3
"""Refresh pohon parameter GenieACS bertahap lewat NBI.

Dijalankan tiap 30 menit oleh cron. Satu device per run, dipilih dari device
yang paling lama belum di-refresh (cooldown 7 hari). Ini menggantikan preset
in-session yang terbukti memicu `too_many_commits` / `session_terminated`
pada device dengan sumber daya terbatas.

Device yang gagal (fault task `session_terminated` / `too_many_rpcs`) diberi
backoff 30 hari agar cron tidak terus-menerus memutus sesi CWMP-nya.

Hanya menyentuh device yang sedang online dan tidak punya fault/task aktif.
Tidak pernah menulis atau mencetak kredensial maupun Connection Request URL.
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
    "TREE_REFRESH_STATE", "/var/lib/genieacs/tree_refresh_state.json"
)
COOLDOWN_DAYS = int(os.environ.get("TREE_REFRESH_COOLDOWN_DAYS", "7"))
FAILURE_BACKOFF_DAYS = int(os.environ.get("TREE_REFRESH_FAILURE_BACKOFF_DAYS", "30"))
ONLINE_MINUTES = int(os.environ.get("TREE_REFRESH_ONLINE_MINUTES", "10"))
TASK_TIMEOUT_MS = int(os.environ.get("TREE_REFRESH_TIMEOUT_MS", "180000"))
HTTP_TIMEOUT = int(os.environ.get("TREE_REFRESH_HTTP_TIMEOUT", "30"))

QUERY = r"""
var out = [];
var online = new Date(Date.now() - %d * 60000);
db.devices.find({}).forEach(function(d) {
  if (!d._lastInform || d._lastInform < online) return;
  if (db.tasks.countDocuments({device: d._id})) return;
  if (db.faults.countDocuments({device: d._id})) return;
  out.push(d._id);
});
print(out.join("\n"));
""" % ONLINE_MINUTES

FAILED_QUERY = r"""
var out = [];
db.faults.find({channel: {$regex: '^task_'}}).forEach(function(f) {
  if (out.indexOf(f.device) < 0) out.push(f.device);
});
print(out.join("\n"));
"""

MIN_TIME = datetime.min.replace(tzinfo=timezone.utc)


def mongosh(script):
    out = subprocess.check_output(
        ["mongosh", DB, "--quiet", "--eval", script], text=True
    )
    return [line.strip() for line in out.splitlines() if line.strip()]


def candidates():
    return mongosh(QUERY)


def failed_devices():
    return mongosh(FAILED_QUERY)


def load_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    tmp = STATE + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")
    os.replace(tmp, STATE)
    os.chmod(STATE, 0o600)


def parse_ts(entry):
    if isinstance(entry, dict):
        value = entry.get("at")
    else:
        value = entry
    if not value:
        return MIN_TIME
    try:
        ts = datetime.fromisoformat(value)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts
    except (TypeError, ValueError):
        return MIN_TIME


def parse_failed_ts(entry):
    if not isinstance(entry, dict):
        return MIN_TIME
    value = entry.get("failedAt")
    if not value:
        return MIN_TIME
    try:
        ts = datetime.fromisoformat(value)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts
    except (TypeError, ValueError):
        return MIN_TIME


def in_backoff(entry, now):
    failed_at = parse_failed_ts(entry)
    return failed_at != MIN_TIME and now - failed_at < timedelta(
        days=FAILURE_BACKOFF_DAYS
    )


def oldest(ids, state):
    return sorted(ids, key=lambda device_id: (parse_ts(state.get(device_id)), device_id))[0]


def refresh(device_id):
    url = "%s/devices/%s/tasks?timeout=%d&connection_request" % (
        NBI,
        urllib.parse.quote(device_id, safe=""),
        TASK_TIMEOUT_MS,
    )
    body = json.dumps({"name": "refreshObject", "objectName": ""}).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            code = resp.status
    except urllib.error.HTTPError as e:
        code = e.code
    except (urllib.error.URLError, OSError):
        # http=000 bisa berarti NBI menerima task sebelum koneksi putus.
        # Catat sebagai terkirim agar tidak dobel di run berikutnya.
        code = 0

    if (200 <= code < 300) or code == 0:
        print("terkirim %s http=%s" % (device_id, code))
        return True
    print("gagal %s http=%s" % (device_id, code))
    return False


def main():
    now = datetime.now(timezone.utc)
    state = load_state()
    ids = candidates()
    failed = set(failed_devices())

    changed = False
    for device_id in failed:
        if in_backoff(state.get(device_id), now):
            continue
        old = state.get(device_id)
        failures = old.get("failures", 0) + 1 if isinstance(old, dict) else 1
        state[device_id] = {
            "at": parse_ts(old).isoformat() if parse_ts(old) != MIN_TIME else now.isoformat(),
            "failedAt": now.isoformat(),
            "failures": failures,
        }
        changed = True
        print("backoff %s failures=%d hari=%d" % (device_id, failures, FAILURE_BACKOFF_DAYS))

    ids = [
        device_id
        for device_id in ids
        if device_id not in failed and not in_backoff(state.get(device_id), now)
    ]
    print(
        "[%s] online=%d state=%d backoff=%d"
        % (now.strftime("%Y-%m-%d %H:%M:%S UTC"), len(ids), len(state), len(failed))
    )
    if changed:
        save_state(state)
    if not ids:
        return

    device_id = oldest(ids, state)
    last = parse_ts(state.get(device_id))
    if last != MIN_TIME and now - last < timedelta(days=COOLDOWN_DAYS):
        print("cooldown %s (terakhir %s)" % (device_id, last.isoformat()))
        return

    if refresh(device_id):
        state[device_id] = now.isoformat()
        save_state(state)


if __name__ == "__main__":
    main()
