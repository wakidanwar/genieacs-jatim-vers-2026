#!/usr/bin/env python3
import argparse
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_template(name: str) -> str:
    path = os.path.join(ROOT, "scripts", "provisions", name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def js_string(s: str) -> str:
    # escape for inclusion inside a JS double-quoted string
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\r", "\\r").replace("\n", "\\n")


def update_script(db: str, prov_id: str, script: str) -> None:
    payload = json.dumps(script)
    idj = json.dumps(prov_id)
    js = f"""
    var s = {payload};
    var id = {idj};
    var r = db.provisions.updateOne({{_id: id}}, {{$set: {{script: s}}}});
    if (!r.matchedCount) {{ db.provisions.insertOne({{_id: id, script: s}}); print('inserted '+id); }}
    else {{ print('updated '+id); }}
    db.cache.deleteMany({{_id: \"cwmp-local-cache-hash\"}});
    """
    subprocess.check_call(["mongosh", db, "--quiet", "--eval", js])


def main() -> None:
    ap = argparse.ArgumentParser(description="Configure GenieACS inform/useradmin provisions in MongoDB from repo templates")
    ap.add_argument("--acs-host", required=True, help="ACS host/IP reachable by CPE")
    ap.add_argument("--acs-port", default="7547", help="ACS CWMP port (default: 7547)")
    ap.add_argument("--connreq-user", required=True, help="CPE Connection Request username")
    ap.add_argument("--connreq-pass", required=True, help="CPE Connection Request password")
    ap.add_argument("--device-user", default="user", help="Device admin username for useradmin provision (default: user)")
    ap.add_argument("--device-pass", required=True, help="Device admin password for useradmin provision")
    ap.add_argument("--super-pass", default=None, help="Optional super password placeholder replacement")
    ap.add_argument("--db", default="genieacs", help="MongoDB database (default: genieacs)")
    args = ap.parse_args()

    url = f"http://{args.acs_host}:{args.acs_port}"

    inform = read_template("inform.js")
    inform = inform.replace('const url = "http://<ACS_HOST>:7547";', f'const url = "{js_string(url)}";')
    inform = inform.replace('const ConnReqUser = "<CONNREQ_USER>";', f'const ConnReqUser = "{js_string(args.connreq_user)}";')
    inform = inform.replace('const ConnReqPass = "<CONNREQ_PASS>";', f'const ConnReqPass = "{js_string(args.connreq_pass)}";')
    update_script(args.db, "inform", inform)

    useradmin = read_template("useradmin.js")
    useradmin = useradmin.replace('const user = "user";', f'const user = "{js_string(args.device_user)}";')
    useradmin = useradmin.replace('const userpw = "<USER_PASSWORD>";', f'const userpw = "{js_string(args.device_pass)}";')
    if args.super_pass is not None:
        useradmin = useradmin.replace('const superpw = "<SUPER_PASSWORD>";', f'const superpw = "{js_string(args.super_pass)}";')
    update_script(args.db, "useradmin", useradmin)

    print("ok provisions configured (inform, useradmin)")


if __name__ == "__main__":
    main()
